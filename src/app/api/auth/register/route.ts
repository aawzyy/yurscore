import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setAuthCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { name, email, password, gender } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Nama dan email wajib diisi" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email ini sudah terdaftar. Silakan login langsung." },
        { status: 400 }
      );
    }

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        password: password || "password123",
        gender: gender || "MALE",
      },
    });

    // Check for any pending club invitations for this email!
    const pendingInvites = await prisma.clubMember.findMany({
      where: {
        invitedEmail: cleanEmail,
        status: "PENDING_INVITE",
      },
      include: { club: true },
    });

    if (pendingInvites.length > 0) {
      await prisma.clubMember.updateMany({
        where: {
          invitedEmail: cleanEmail,
        },
        data: {
          userId: newUser.id,
          status: "ACTIVE",
        },
      });
    }

    await setAuthCookie(newUser.id);

    return NextResponse.json({
      success: true,
      user: newUser,
      activatedClubInvites: pendingInvites.map((p) => p.club.name),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal registrasi" }, { status: 500 });
  }
}
