import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST: Member responds to RSVP (accept/decline)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Harus login dulu" }, { status: 401 });

    const { rsvpStatus, note } = await req.json();
    if (!["ACCEPTED", "DECLINED"].includes(rsvpStatus)) {
      return NextResponse.json(
        { error: "rsvpStatus harus ACCEPTED atau DECLINED" },
        { status: 400 }
      );
    }

    // Find the RSVP for this user
    const rsvp = await prisma.scheduledGameRsvp.findFirst({
      where: {
        scheduledGameId: id,
        OR: [{ userId: user.id }, { memberEmail: user.email }],
      },
    });

    if (!rsvp) {
      // If not found, create one (in case they were added after game was created)
      const game = await prisma.scheduledGame.findUnique({ where: { id } });
      if (!game || game.status !== "OPEN") {
        return NextResponse.json(
          { error: "Game tidak open untuk RSVP" },
          { status: 400 }
        );
      }

      const newRsvp = await prisma.scheduledGameRsvp.create({
        data: {
          scheduledGameId: id,
          userId: user.id,
          memberEmail: user.email,
          memberName: user.name,
          memberGender: user.gender,
          rsvpStatus,
          note: note?.trim(),
          respondedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, rsvp: newRsvp });
    }

    // Check if game is still open for responses
    const game = await prisma.scheduledGame.findUnique({ where: { id } });
    if (game?.status !== "OPEN" && game?.status !== "LOCKED") {
      return NextResponse.json(
        { error: "Game sudah tidak menerima perubahan RSVP" },
        { status: 400 }
      );
    }

    const updated = await prisma.scheduledGameRsvp.update({
      where: { id: rsvp.id },
      data: {
        rsvpStatus,
        note: note?.trim(),
        respondedAt: new Date(),
        userId: rsvp.userId || user.id,
        memberName: rsvp.memberName || user.name,
        memberGender: rsvp.memberGender || user.gender,
      },
    });

    return NextResponse.json({ success: true, rsvp: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Admin adjusts day-of lineup (override individual player's participation)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { rsvpId, dayOfStatus } = await req.json();
    if (!rsvpId || !["PLAYING", "SITTING_OUT", null].includes(dayOfStatus)) {
      return NextResponse.json({ error: "rsvpId and valid dayOfStatus required" }, { status: 400 });
    }

    const updated = await prisma.scheduledGameRsvp.update({
      where: { id: rsvpId },
      data: { dayOfStatus },
    });

    return NextResponse.json({ success: true, rsvp: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
