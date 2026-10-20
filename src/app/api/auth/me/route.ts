import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, gender: true, avatarUrl: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    user,
    availableUsers: allUsers,
  });
}
