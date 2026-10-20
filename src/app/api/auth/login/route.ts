import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setAuthCookie, clearAuthCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password, userId } = await req.json();

    let user;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    } else if (email) {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      // In production you would compare hashed password; for prototype we accept password123 or whatever they set
      if (!user) {
        return NextResponse.json(
          { error: "Akun dengan email ini belum terdaftar. Silakan registrasi terlebih dahulu." },
          { status: 404 }
        );
      }
    }

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    await setAuthCookie(user.id);
    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal login" }, { status: 500 });
  }
}
