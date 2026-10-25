import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeStandings } from "@/lib/tournament/generators";

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
        rounds: { include: { matches: true } },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Turnamen tidak ditemukan" }, { status: 404 });
    }

    // Auto-mark any matches with scores as COMPLETED if they were not already
    for (const round of tournament.rounds) {
      for (const match of round.matches) {
        if (
          match.status !== "COMPLETED" &&
          (match.team1Score > 0 || match.team2Score > 0)
        ) {
          await prisma.tournamentMatch.update({
            where: { id: match.id },
            data: { status: "COMPLETED", completedAt: new Date() },
          });
          match.status = "COMPLETED";
        }
      }
    }

    // Re-fetch all matches with updated statuses
    const updatedTournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        players: true,
        rounds: { include: { matches: true } },
      },
    });

    const allMatches = (updatedTournament || tournament).rounds.flatMap((r) => r.matches);
    const standings = computeStandings(
      tournament.players.map((p) => ({ id: p.id, name: p.name, gender: p.gender })),
      allMatches
    );

    // Save final ranks to DB
    for (const s of standings) {
      await prisma.tournamentPlayer.update({
        where: { id: s.playerId },
        data: {
          pointsScored: s.pointsScored,
          pointsConceded: s.pointsConceded,
          matchesPlayed: s.matchesPlayed,
          matchesWon: s.matchesWon,
          matchesLost: s.matchesLost,
          matchesDrawn: s.matchesDrawn,
          pointDiff: s.pointDiff,
          rank: s.rank,
        },
      });
    }

    // Mark tournament as COMPLETED
    const updated = await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "COMPLETED" },
    });

    // Also mark any linked scheduled games as COMPLETED
    await prisma.scheduledGame.updateMany({
      where: { tournamentId },
      data: { status: "COMPLETED" },
    });

    return NextResponse.json({
      success: true,
      tournament: updated,
      finalStandings: standings,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Gagal menyelesaikan turnamen" },
      { status: 500 }
    );
  }
}
