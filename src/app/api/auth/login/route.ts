import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setAuthCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email?.trim() || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Akun dengan email ini belum terdaftar. Silakan registrasi terlebih dahulu." },
        { status: 404 }
      );
    }

    // Validate password
    if (user.password && user.password !== password) {
      return NextResponse.json(
        { error: "Password salah. Silakan periksa kembali password Anda." },
        { status: 401 }
      );
    }

    await setAuthCookie(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Gagal login" },
      { status: 500 }
    );
  }
}
