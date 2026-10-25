import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        club: {
          include: {
            members: user ? { where: { userId: user.id } } : false,
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Turnamen tidak ditemukan" }, { status: 404 });
    }

    // Free games can be deleted by anyone or their creator; club tournaments by club owner/admin
    if (tournament.clubId && user) {
      const isOwner = tournament.club?.ownerId === user.id;
      const isAdmin = (tournament.club?.members || []).some((m) => m.role === "ADMIN");
      if (!isOwner && !isAdmin && tournament.createdById !== user.id) {
        return NextResponse.json(
          { error: "Hanya Admin atau Pemilik Club yang dapat menghapus turnamen ini" },
          { status: 403 }
        );
      }
    }

    // Delete cascading matches and rounds
    await prisma.tournamentMatch.deleteMany({
      where: { round: { tournamentId: id } },
    });
    await prisma.tournamentRound.deleteMany({
      where: { tournamentId: id },
    });
    await prisma.tournamentPlayer.deleteMany({
      where: { tournamentId: id },
    });
    // Unlink any scheduled games referencing this tournament
    await prisma.scheduledGame.updateMany({
      where: { tournamentId: id },
      data: { tournamentId: null, status: "OPEN" },
    });
    await prisma.tournament.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Turnamen berhasil dihapus" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Gagal menghapus turnamen" },
      { status: 500 }
    );
  }
}
