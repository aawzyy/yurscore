import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeStandings } from "@/lib/tournament/generators";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        club: { select: { id: true, name: true, code: true } },
        creator: { select: { id: true, name: true, email: true } },
        players: true,
        rounds: {
          orderBy: { roundNumber: "asc" },
          include: {
            matches: {
              orderBy: { courtNumber: "asc" },
            },
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Turnamen tidak ditemukan" }, { status: 404 });
    }

    // Collect all matches from all rounds
    const allMatches = tournament.rounds.flatMap((r) => r.matches);

    // Compute live standings
    const standings = computeStandings(
      tournament.players.map((p) => ({ id: p.id, name: p.name, gender: p.gender })),
      allMatches
    );

    // Check progress
    const totalMatchesCount = allMatches.length;
    const completedMatchesCount = allMatches.filter((m) => m.status === "COMPLETED").length;

    return NextResponse.json({
      tournament,
      standings,
      stats: {
        totalMatchesCount,
        completedMatchesCount,
        progressPercent:
          totalMatchesCount > 0
            ? Math.round((completedMatchesCount / totalMatchesCount) * 100)
            : 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Gagal mengambil data turnamen" },
      { status: 500 }
    );
  }
}
