import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu untuk bergabung ke club" },
        { status: 401 }
      );
    }

    const { code } = await req.json();
    if (!code?.trim()) {
      return NextResponse.json(
        { error: "Kode club wajib diisi" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    const club = await prisma.club.findUnique({
      where: { code: cleanCode },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    if (!club) {
      return NextResponse.json(
        { error: `Club dengan kode "${cleanCode}" tidak ditemukan` },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existing = await prisma.clubMember.findFirst({
      where: {
        clubId: club.id,
        OR: [
          { userId: user.id },
          { invitedEmail: user.email.toLowerCase().trim() },
        ],
      },
    });

    if (existing && existing.status === "ACTIVE") {
      return NextResponse.json({
        success: true,
        alreadyMember: true,
        club,
        message: `Anda sudah terdaftar sebagai anggota di club "${club.name}"`,
      });
    }

    if (existing) {
      // Activate pending invite
      await prisma.clubMember.update({
        where: { id: existing.id },
        data: {
          userId: user.id,
          status: "ACTIVE",
        },
      });
    } else {
      // Create new active membership
      await prisma.clubMember.create({
        data: {
          clubId: club.id,
          userId: user.id,
          invitedEmail: user.email.toLowerCase().trim(),
          role: "MEMBER",
          status: "ACTIVE",
        },
      });
    }

    return NextResponse.json({
      success: true,
      club,
      message: `Selamat! Anda berhasil bergabung ke club "${club.name}"`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Gagal bergabung ke club" },
      { status: 500 }
    );
  }
}
