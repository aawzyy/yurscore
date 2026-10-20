import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET: Get a single scheduled game with full RSVP details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const game = await prisma.scheduledGame.findUnique({
    where: { id },
    include: {
      club: { select: { id: true, name: true, code: true } },
      creator: { select: { id: true, name: true, email: true } },
      rsvps: {
        include: {
          user: { select: { id: true, name: true, gender: true, avatarUrl: true } },
        },
        orderBy: [{ rsvpStatus: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!game) {
    return NextResponse.json({ error: "Scheduled game tidak ditemukan" }, { status: 404 });
  }

  // Stats summary
  const accepted = game.rsvps.filter((r) => r.rsvpStatus === "ACCEPTED").length;
  const declined = game.rsvps.filter((r) => r.rsvpStatus === "DECLINED").length;
  const pending = game.rsvps.filter((r) => r.rsvpStatus === "PENDING").length;

  // Effective playing list: ACCEPTED + not overridden to SITTING_OUT, plus SITTING_OUT override
  const playingList = game.rsvps.filter((r) => {
    if (r.dayOfStatus === "PLAYING") return true;
    if (r.dayOfStatus === "SITTING_OUT") return false;
    return r.rsvpStatus === "ACCEPTED";
  });

  return NextResponse.json({
    game,
    stats: { accepted, declined, pending, playing: playingList.length },
    playingList,
  });
}

// PATCH: Update game status (admin: LOCK, CANCEL) or update game details
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const updated = await prisma.scheduledGame.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.title && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.scheduledAt && { scheduledAt: new Date(body.scheduledAt) }),
        ...(body.rsvpDeadline !== undefined && {
          rsvpDeadline: body.rsvpDeadline ? new Date(body.rsvpDeadline) : null,
        }),
        ...(body.totalCourts && { totalCourts: Number(body.totalCourts) }),
        ...(body.totalRounds && { totalRounds: Number(body.totalRounds) }),
        ...(body.targetPoints && { targetPoints: Number(body.targetPoints) }),
        ...(body.tournamentId !== undefined && { tournamentId: body.tournamentId }),
      },
    });

    return NextResponse.json({ success: true, game: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
