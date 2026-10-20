import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    const club = await prisma.club.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, gender: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        tournaments: {
          orderBy: { createdAt: "desc" },
          include: {
            players: {
              orderBy: { rank: "asc" },
            },
            rounds: {
              include: {
                matches: true,
              },
            },
          },
        },
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club tidak ditemukan" }, { status: 404 });
    }

    const isOwner = user?.id === club.ownerId;
    const currentMember = club.members.find((m) => m.userId === user?.id);

    return NextResponse.json({
      club,
      currentUserRole: isOwner ? "OWNER" : currentMember?.role || "GUEST",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal mengambil data club" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const club = await prisma.club.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club tidak ditemukan" }, { status: 404 });
    }

    const isOwner = club.ownerId === user.id;
    const memberRecord = club.members.find((m) => m.userId === user.id);
    const isAdmin = isOwner || memberRecord?.role === "ADMIN";

    if (!isAdmin) {
      return NextResponse.json({ error: "Hanya Admin atau Owner yang dapat mengedit info club" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nama club tidak boleh kosong" }, { status: 400 });
    }

    const updatedClub = await prisma.club.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description !== undefined ? description.trim() : club.description,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, gender: true, avatarUrl: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, club: updatedClub });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal mengupdate club" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const club = await prisma.club.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club tidak ditemukan" }, { status: 404 });
    }

    const isOwner = club.ownerId === user.id;
    const memberRecord = club.members.find((m) => m.userId === user.id);
    const isAdmin = isOwner || memberRecord?.role === "ADMIN";

    if (!isAdmin) {
      return NextResponse.json({ error: "Hanya Owner atau Admin yang dapat menghapus club" }, { status: 403 });
    }

    // Cascade delete is configured in Prisma schema
    await prisma.club.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Club berhasil dihapus" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menghapus club" }, { status: 500 });
  }
}
