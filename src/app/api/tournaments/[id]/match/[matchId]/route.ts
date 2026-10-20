import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeStandings } from "@/lib/tournament/generators";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  try {
    const { id: tournamentId, matchId } = await params;
    const body = await req.json();
    const { team1Score, team2Score, status, servingTeam } = body;

    const existingMatch = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      include: { round: true },
    });

    if (!existingMatch) {
      return NextResponse.json({ error: "Match tidak ditemukan" }, { status: 404 });
    }

    const updatedMatch = await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: {
        team1Score: typeof team1Score === "number" ? team1Score : existingMatch.team1Score,
        team2Score: typeof team2Score === "number" ? team2Score : existingMatch.team2Score,
        status: status || existingMatch.status,
        servingTeam: typeof servingTeam === "number" ? servingTeam : existingMatch.servingTeam,
        completedAt: status === "COMPLETED" ? new Date() : existingMatch.completedAt,
      },
    });

    // Check round matches completion
    const roundMatches = await prisma.tournamentMatch.findMany({
      where: { roundId: existingMatch.roundId },
    });

    const isRoundDone = roundMatches.every((m) => m.status === "COMPLETED");

    if (isRoundDone) {
      await prisma.tournamentRound.update({
        where: { id: existingMatch.roundId },
        data: { status: "COMPLETED" },
      });

      // Activate next round if it exists
      const nextRound = await prisma.tournamentRound.findFirst({
        where: {
          tournamentId,
          roundNumber: existingMatch.round.roundNumber + 1,
        },
      });

      if (nextRound) {
        await prisma.tournamentRound.update({
          where: { id: nextRound.id },
          data: { status: "ACTIVE" },
        });
        await prisma.tournamentMatch.updateMany({
          where: { roundId: nextRound.id },
          data: { status: "IN_PROGRESS" },
        });
      }
    }

    // Recompute standings and sync with TournamentPlayer records
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        players: true,
        rounds: { include: { matches: true } },
      },
    });

    if (tournament) {
      const allMatches = tournament.rounds.flatMap((r) => r.matches);
      const computed = computeStandings(
        tournament.players.map((p) => ({ id: p.id, name: p.name, gender: p.gender })),
        allMatches
      );

      // Batch update player stats
      for (const stat of computed) {
        await prisma.tournamentPlayer.update({
          where: { id: stat.playerId },
          data: {
            pointsScored: stat.pointsScored,
            pointsConceded: stat.pointsConceded,
            matchesPlayed: stat.matchesPlayed,
            matchesWon: stat.matchesWon,
            matchesLost: stat.matchesLost,
            matchesDrawn: stat.matchesDrawn,
            pointDiff: stat.pointDiff,
            rank: stat.rank,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      match: updatedMatch,
      isRoundDone,
    });
  } catch (err: any) {
    console.error("Match update error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal update match" },
      { status: 500 }
    );
  }
}
