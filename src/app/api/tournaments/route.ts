import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  generateAmericanoRounds,
  generateNextMexicanoRound,
} from "@/lib/tournament/generators";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clubId = searchParams.get("clubId");

  const tournaments = await prisma.tournament.findMany({
    where: clubId ? { clubId } : undefined,
    include: {
      club: { select: { id: true, name: true } },
      players: { orderBy: { rank: "asc" } },
      rounds: {
        include: {
          matches: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ tournaments });
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const {
      title,
      sportId = "padel",
      format = "americano",
      scoringMode = "split_points",
      targetPoints = 32,
      totalCourts = 1,
      totalRounds = 4,
      isFreeGame = false,
      clubId = null,
      players = [], // Array of { name, gender, userId? }
    } = body;

    if (!players || players.length < 4) {
      return NextResponse.json(
        { error: "Diperlukan minimal 4 pemain untuk memulai turnamen/game" },
        { status: 400 }
      );
    }

    const tournamentTitle =
      title?.trim() ||
      `${sportId.toUpperCase()} ${format.toUpperCase()} ${isFreeGame ? "(Free Game)" : ""}`.trim();

    // 1. Create Tournament record
    const tournament = await prisma.tournament.create({
      data: {
        title: tournamentTitle,
        sportId,
        format,
        scoringMode,
        targetPoints: Number(targetPoints),
        totalCourts: Math.max(1, Number(totalCourts)),
        totalRounds: Math.max(1, Number(totalRounds)),
        isFreeGame: Boolean(isFreeGame),
        clubId: clubId || null,
        createdById: user?.id || null,
        status: "IN_PROGRESS",
      },
    });

    // Pre-fetch all registered users to auto-link players by name or email
    const allUsers = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map<string, string>();
    allUsers.forEach((u) => {
      userMap.set(u.name.toLowerCase().trim(), u.id);
      userMap.set(u.email.toLowerCase().trim(), u.id);
      const emailPrefix = u.email.split("@")[0].toLowerCase();
      userMap.set(emailPrefix, u.id);
    });
    // Common aliases
    if (userMap.has("ardhi")) userMap.set("ardi", userMap.get("ardhi")!);
    if (userMap.has("savira")) userMap.set("vira", userMap.get("savira")!);

    // 2. Create Tournament Players
    const createdPlayers = await Promise.all(
      players.map((p: any, idx: number) => {
        const cleanName = (p.name || "").trim();
        const matchedUserId =
          p.userId ||
          userMap.get(cleanName.toLowerCase()) ||
          null;

        return prisma.tournamentPlayer.create({
          data: {
            tournamentId: tournament.id,
            userId: matchedUserId,
            name: cleanName || `Player ${idx + 1}`,
            gender: p.gender || "MALE",
            rank: idx + 1,
          },
        });
      })
    );

    const playerRefs = createdPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      gender: p.gender,
    }));

    // 3. Generate Rounds & Matches based on Format
    if (format === "mexicano") {
      // In Mexicano, Round 1 is generated initially, subsequent rounds are generated dynamically based on standings
      // For round 1, we can create initial seeding or randomized pairings
      const initialStandings = playerRefs.map((p, index) => ({
        playerId: p.id,
        name: p.name,
        rank: index + 1,
        points: 0,
      }));

      const courts = Math.max(
        1,
        Math.min(Number(totalCourts) || 1, Math.floor(playerRefs.length / 4))
      );

      const r1 = generateNextMexicanoRound(
        1,
        initialStandings,
        courts
      );

      const createdRound = await prisma.tournamentRound.create({
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
      // Americano or Round Robin: Pre-generate all balanced rounds
      const courts = Math.max(
        1,
        Math.min(Number(totalCourts) || 1, Math.floor(playerRefs.length / 4))
      );
      const roundsData = generateAmericanoRounds(
        playerRefs,
        Number(totalRounds),
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

    return NextResponse.json({
      success: true,
      tournamentId: tournament.id,
      tournament,
    });
  } catch (err: any) {
    console.error("Error creating tournament:", err);
    return NextResponse.json(
      { error: err.message || "Gagal membuat turnamen" },
      { status: 500 }
    );
  }
}
