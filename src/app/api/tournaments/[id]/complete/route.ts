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

    // Recompute final standings
    const allMatches = tournament.rounds.flatMap((r) => r.matches);
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
