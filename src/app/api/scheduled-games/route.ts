import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET: List scheduled games for a club
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clubId = searchParams.get("clubId");

  if (!clubId) {
    return NextResponse.json({ error: "clubId required" }, { status: 400 });
  }

  const games = await prisma.scheduledGame.findMany({
    where: { clubId },
    include: {
      creator: { select: { id: true, name: true } },
      rsvps: {
        include: {
          user: { select: { id: true, name: true, gender: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json({ games });
}

// POST: Admin creates a new scheduled game
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Harus login terlebih dahulu" }, { status: 401 });
    }

    const body = await req.json();
    const {
      clubId,
      title,
      description,
      sportId = "padel",
      format = "americano",
      scoringMode = "split_points",
      targetPoints = 32,
      totalCourts = 1,
      totalRounds = 4,
      scheduledAt,
      location,
      maxPlayers = 16,
      rsvpDeadline,
      notes,
    } = body;

    if (!clubId || !title || !scheduledAt) {
      return NextResponse.json(
        { error: "clubId, title, dan scheduledAt wajib diisi" },
        { status: 400 }
      );
    }

    // Verify the user is admin/owner of this club
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: { members: { include: { user: true } } },
    });

    if (!club) {
      return NextResponse.json({ error: "Club tidak ditemukan" }, { status: 404 });
    }

    const isOwner = club.ownerId === user.id;
    const memberRecord = club.members.find(
      (m) => m.userId === user.id || m.invitedEmail === user.email
    );
    const isAdmin = isOwner || memberRecord?.role === "ADMIN";

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Hanya Admin/Owner club yang bisa membuat scheduled game" },
        { status: 403 }
      );
    }

    // Create the scheduled game
    const game = await prisma.scheduledGame.create({
      data: {
        clubId,
        createdById: user.id,
        title: title.trim(),
        description: description?.trim(),
        sportId,
        format,
        scoringMode,
        targetPoints: Number(targetPoints),
        totalCourts: Number(totalCourts),
        totalRounds: Number(totalRounds),
        scheduledAt: new Date(scheduledAt),
        location: location?.trim(),
        maxPlayers: Number(maxPlayers),
        rsvpDeadline: rsvpDeadline ? new Date(rsvpDeadline) : null,
        notes: notes?.trim(),
        status: "OPEN",
      },
    });

    // Auto-create RSVP records (PENDING) for all active club members
    const activeMembers = club.members.filter((m) => m.status === "ACTIVE");
    if (activeMembers.length > 0) {
      await prisma.scheduledGameRsvp.createMany({
        data: activeMembers.map((m) => ({
          scheduledGameId: game.id,
          userId: m.userId || null,
          memberEmail: m.invitedEmail,
          memberName: m.user?.name || m.invitedEmail.split("@")[0],
          memberGender: m.user?.gender || "MALE",
          rsvpStatus: "PENDING",
        })),
      });
    }

    // Fetch the game with RSVPs to return
    const gameWithRsvps = await prisma.scheduledGame.findUnique({
      where: { id: game.id },
      include: {
        creator: { select: { id: true, name: true } },
        rsvps: {
          include: {
            user: { select: { id: true, name: true, gender: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      game: gameWithRsvps,
      invitedCount: activeMembers.length,
    });
  } catch (err: any) {
    console.error("Create scheduled game error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal membuat scheduled game" },
      { status: 500 }
    );
  }
}
