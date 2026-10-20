import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get clubs where user is owner or member
    const memberships = await prisma.clubMember.findMany({
      where: {
        OR: [{ userId: user.id }, { invitedEmail: user.email }],
      },
      include: {
        club: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
            _count: { select: { members: true, tournaments: true } },
          },
        },
      },
    });

    const clubs = memberships.map((m) => {
      const isOwner = m.club.ownerId === user.id;
      const role = isOwner ? "OWNER" : m.role;
      return {
        id: m.club.id,
        name: m.club.name,
        description: m.club.description,
        code: m.club.code,
        ownerName: m.club.owner.name,
        memberCount: m.club._count.members,
        tournamentCount: m.club._count.tournaments,
        userRole: role, // "OWNER", "ADMIN", "MEMBER"
        memberStatus: m.status,
      };
    });

    // 2. Find tournaments the user participated in
    const userTournaments = await prisma.tournament.findMany({
      where: {
        OR: [
          { players: { some: { userId: user.id } } },
          { players: { some: { name: user.name } } },
          { club: { members: { some: { userId: user.id } } } },
        ],
      },
      include: {
        club: { select: { id: true, name: true, code: true } },
        players: { orderBy: { rank: "asc" } },
        rounds: {
          include: {
            matches: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Scheduled games the user is invited to
    const userClubIds = memberships.map((m) => m.club.id);

    const upcomingScheduledGames = await prisma.scheduledGame.findMany({
      where: {
        clubId: { in: userClubIds },
        status: { in: ["OPEN", "LOCKED"] },
        scheduledAt: { gte: new Date() },
      },
      include: {
        club: { select: { id: true, name: true } },
        rsvps: {
          where: {
            OR: [{ userId: user.id }, { memberEmail: user.email }],
          },
        },
        _count: {
          select: {
            rsvps: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    // Attach user's own RSVP status to each game
    const scheduledGamesWithMyRsvp = upcomingScheduledGames.map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      clubId: g.clubId,
      clubName: g.club.name,
      sportId: g.sportId,
      format: g.format,
      scheduledAt: g.scheduledAt,
      location: g.location,
      totalCourts: g.totalCourts,
      targetPoints: g.targetPoints,
      maxPlayers: g.maxPlayers,
      status: g.status,
      rsvpDeadline: g.rsvpDeadline,
      notes: g.notes,
      totalInvited: g._count.rsvps,
      myRsvp: g.rsvps[0] || null, // The user's own RSVP record
    }));

    // 4. Separate Active / Next Game vs Completed Games
    const activeTournaments = userTournaments.filter(
      (t) => t.status === "IN_PROGRESS"
    );
    const completedTournaments = userTournaments.filter(
      (t) => t.status === "COMPLETED"
    );

    const nextGame = activeTournaments[0] || null;

    // 4. Calculate Personal Stats
    let totalMatches = 0;
    let totalWins = 0;
    let totalPoints = 0;
    let goldTrophies = 0;
    let podiums = 0;

    const personalHistory = completedTournaments.map((t) => {
      const myPlayer = t.players.find(
        (p) => p.userId === user.id || p.name === user.name
      );

      if (myPlayer) {
        totalMatches += myPlayer.matchesPlayed;
        totalWins += myPlayer.matchesWon;
        totalPoints += myPlayer.pointsScored;
        if (myPlayer.rank === 1) goldTrophies += 1;
        if (myPlayer.rank <= 3) podiums += 1;
      }

      return {
        tournamentId: t.id,
        title: t.title,
        sportId: t.sportId,
        format: t.format,
        targetPoints: t.targetPoints,
        clubName: t.club?.name || "Free Game",
        date: t.createdAt,
        myRank: myPlayer?.rank || null,
        myPoints: myPlayer?.pointsScored || 0,
        myMatches: myPlayer?.matchesPlayed || 0,
        myWins: myPlayer?.matchesWon || 0,
        totalPlayers: t.players.length,
        winnerName: t.players[0]?.name || "N/A",
      };
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        gender: user.gender,
      },
      clubs,
      hasAdminAccess: clubs.some(
        (c) => c.userRole === "OWNER" || c.userRole === "ADMIN"
      ),
      nextGame: nextGame
        ? {
            id: nextGame.id,
            title: nextGame.title,
            sportId: nextGame.sportId,
            format: nextGame.format,
            clubName: nextGame.club?.name || "Free Game",
            totalCourts: nextGame.totalCourts,
            targetPoints: nextGame.targetPoints,
            status: nextGame.status,
            createdAt: nextGame.createdAt,
            myPlayer: nextGame.players.find(
              (p) => p.userId === user.id || p.name === user.name
            ),
          }
        : null,
      personalStats: {
        totalMatches,
        totalWins,
        winRate:
          totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0,
        totalPoints,
        goldTrophies,
        podiums,
      },
      personalHistory,
      scheduledGames: scheduledGamesWithMyRsvp,
    });
  } catch (err: any) {
    console.error("Dashboard error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
