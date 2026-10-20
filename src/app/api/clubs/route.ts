import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clubs = await prisma.club.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { members: { some: { userId: user.id } } },
        { members: { some: { invitedEmail: user.email } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, gender: true, avatarUrl: true } },
        },
      },
      tournaments: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          players: true,
        },
      },
      _count: {
        select: { members: true, tournaments: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ clubs });
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const { name, description } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Nama club tidak boleh kosong" }, { status: 400 });
    }

    const code = `${name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "CLB")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const club = await prisma.club.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        code,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            invitedEmail: user.email,
            role: "ADMIN",
            status: "ACTIVE",
          },
        },
      },
      include: {
        owner: true,
        members: { include: { user: true } },
      },
    });

    return NextResponse.json({ success: true, club });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal membuat club" }, { status: 500 });
  }
}
