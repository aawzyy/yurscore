import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  generateAmericanoRounds,
  generateNextMexicanoRound,
} from "@/lib/tournament/generators";

// POST: Admin kicks off the actual tournament from a scheduled game
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch the scheduled game with RSVPs
    const scheduledGame = await prisma.scheduledGame.findUnique({
      where: { id },
      include: {
        club: { select: { id: true, name: true, ownerId: true } },
        rsvps: {
          include: {
            user: { select: { id: true, name: true, gender: true } },
          },
        },
      },
    });

    if (!scheduledGame) {
      return NextResponse.json({ error: "Scheduled game tidak ditemukan" }, { status: 404 });
    }

    if (scheduledGame.status === "IN_PROGRESS" || scheduledGame.status === "COMPLETED") {
      return NextResponse.json({ error: "Game sudah dimulai" }, { status: 400 });
    }

    // Build final player list:
    // dayOfStatus takes priority over rsvpStatus
    // PLAYING (dayOf override) → play
    // SITTING_OUT (dayOf override) → sit out
    // null dayOf + ACCEPTED rsvp → play
    // null dayOf + DECLINED/PENDING → sit out
    const { customPlayers } = await req.json().catch(() => ({ customPlayers: null }));

    let playersForTournament: Array<{ userId: string | null; name: string; gender: string }> = [];

    if (customPlayers && Array.isArray(customPlayers) && customPlayers.length >= 4) {
      // Admin explicitly chose who's playing (day-of lineup override)
      playersForTournament = customPlayers;
    } else {
      // Auto-build from RSVP statuses
      const playing = scheduledGame.rsvps.filter((r) => {
        if (r.dayOfStatus === "PLAYING") return true;
        if (r.dayOfStatus === "SITTING_OUT") return false;
        return r.rsvpStatus === "ACCEPTED";
      });

      if (playing.length < 4) {
        return NextResponse.json(
          { error: `Hanya ${playing.length} pemain yang konfirmasi hadir. Minimal 4 pemain.` },
          { status: 400 }
        );
      }

      playersForTournament = playing.map((r) => ({
        userId: r.userId,
        name: r.user?.name || r.memberName,
        gender: r.user?.gender || r.memberGender,
      }));
    }

    // Create the Tournament
    const tournament = await prisma.tournament.create({
      data: {
        title: scheduledGame.title,
        sportId: scheduledGame.sportId,
        format: scheduledGame.format,
        scoringMode: scheduledGame.scoringMode,
        targetPoints: scheduledGame.targetPoints,
        totalCourts: Math.max(
          1,
          Math.min(scheduledGame.totalCourts, Math.floor(playersForTournament.length / 4))
        ),
        totalRounds: scheduledGame.totalRounds,
        isFreeGame: false,
        clubId: scheduledGame.clubId,
        createdById: user.id,
        status: "IN_PROGRESS",
      },
    });

    // Create Tournament Players
    const createdPlayers = await Promise.all(
      playersForTournament.map((p, idx) =>
        prisma.tournamentPlayer.create({
          data: {
            tournamentId: tournament.id,
            userId: p.userId || null,
            name: p.name,
            gender: p.gender,
            rank: idx + 1,
          },
        })
      )
    );

    const playerRefs = createdPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      gender: p.gender,
    }));

    const courts = Math.max(
      1,
      Math.min(scheduledGame.totalCourts, Math.floor(playerRefs.length / 4))
    );

    // Generate rounds
    if (scheduledGame.format === "mexicano") {
      const initialStandings = playerRefs.map((p, i) => ({
        playerId: p.id,
        name: p.name,
        rank: i + 1,
        points: 0,
      }));
      const r1 = generateNextMexicanoRound(1, initialStandings, courts);

      await prisma.tournamentRound.create({
        data: {
          tournamentId: tournament.id,
          roundNumber: 1,
          status: "ACTIVE",
          matches: {
            create: r1.matches.map((m) => ({
              courtNumber: m.courtNumber,
              team1Player1Id: m.team1Player1Id,
              team1Player2Id: m.team1Player2Id,
              team1Name: m.team1Name,
              team2Player1Id: m.team2Player1Id,
              team2Player2Id: m.team2Player2Id,
              team2Name: m.team2Name,
              status: "IN_PROGRESS",
            })),
          },
        },
      });
    } else {
      const roundsData = generateAmericanoRounds(
        playerRefs,
        scheduledGame.totalRounds,
        courts
      );
      for (let i = 0; i < roundsData.length; i++) {
        const rData = roundsData[i];
        await prisma.tournamentRound.create({
          data: {
            tournamentId: tournament.id,
            roundNumber: rData.roundNumber,
            status: i === 0 ? "ACTIVE" : "PENDING",
            matches: {
              create: rData.matches.map((m) => ({
                courtNumber: m.courtNumber,
                team1Player1Id: m.team1Player1Id,
                team1Player2Id: m.team1Player2Id,
                team1Name: m.team1Name,
                team2Player1Id: m.team2Player1Id,
                team2Player2Id: m.team2Player2Id,
                team2Name: m.team2Name,
                status: i === 0 ? "IN_PROGRESS" : "UPCOMING",
              })),
            },
          },
        });
      }
    }

    // Mark scheduled game as IN_PROGRESS and link tournament
    await prisma.scheduledGame.update({
      where: { id },
      data: {
        status: "IN_PROGRESS",
        tournamentId: tournament.id,
      },
    });

    return NextResponse.json({
      success: true,
      tournamentId: tournament.id,
      playerCount: playersForTournament.length,
    });
  } catch (err: any) {
    console.error("Start scheduled game error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
