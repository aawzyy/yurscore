import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  computeStandings,
  generateNextMexicanoRound,
} from "@/lib/tournament/generators";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        players: true,
        rounds: {
          include: { matches: true },
          orderBy: { roundNumber: "desc" },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Turnamen tidak ditemukan" }, { status: 404 });
    }

    const currentRoundsCount = tournament.rounds.length;
    const nextRoundNumber = currentRoundsCount + 1;

    // Check if max rounds reached
    if (currentRoundsCount >= tournament.totalRounds) {
      return NextResponse.json(
        { error: `Semua ronde (${tournament.totalRounds}) sudah dibuat.` },
        { status: 400 }
      );
    }

    // Compute current standings
    const allMatches = tournament.rounds.flatMap((r) => r.matches);
    const standings = computeStandings(
      tournament.players.map((p) => ({ id: p.id, name: p.name, gender: p.gender })),
      allMatches
    );

    const standingsForGen = standings.map((s) => ({
      playerId: s.playerId,
      name: s.name,
      rank: s.rank,
      points: s.pointsScored,
    }));

    // Generate Mexicano pairings
    const courts = Math.max(
      1,
      Math.min(tournament.totalCourts || 1, Math.floor(tournament.players.length / 4))
    );
    const generated = generateNextMexicanoRound(
      nextRoundNumber,
      standingsForGen,
      courts
    );

    // Save next round
    const newRound = await prisma.tournamentRound.create({
      data: {
        tournamentId,
        roundNumber: nextRoundNumber,
        status: "ACTIVE",
        matches: {
          create: generated.matches.map((m) => ({
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
      include: {
        matches: true,
      },
    });

    return NextResponse.json({
      success: true,
      round: newRound,
    });
  } catch (err: any) {
    console.error("Generate next round error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal membuat ronde baru" },
      { status: 500 }
    );
  }
}
