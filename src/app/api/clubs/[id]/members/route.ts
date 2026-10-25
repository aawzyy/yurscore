import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendClubInviteEmail } from "@/lib/email";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clubId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ error: "Club tidak ditemukan" }, { status: 404 });
    }

    const { email, role = "MEMBER" } = await req.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if member already in this club
    const existingMember = await prisma.clubMember.findUnique({
      where: {
        clubId_invitedEmail: {
          clubId,
          invitedEmail: cleanEmail,
        },
      },
    });

    if (existingMember && existingMember.status === "ACTIVE") {
      return NextResponse.json(
        { error: "Member ini sudah aktif terdaftar di club" },
        { status: 400 }
      );
    }

    // Check if this email is already registered in YurScore
    const registeredUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    let newMember;
    let inviteNotice = "";

    if (existingMember && existingMember.status === "PENDING_INVITE") {
      // Re-send invite
      newMember = existingMember;
      inviteNotice = `Email undangan telah dikirim ulang ke ${cleanEmail}.`;
    } else if (registeredUser) {
      // User is already registered! Automatically activate membership
      newMember = await prisma.clubMember.create({
        data: {
          clubId,
          userId: registeredUser.id,
          invitedEmail: cleanEmail,
          role,
          status: "ACTIVE",
        },
        include: { user: true },
      });
      inviteNotice = `User "${registeredUser.name}" ditemukan dan langsung ditambahkan ke club!`;
    } else {
      // User is not registered yet! Create pending invite and send invitation
      newMember = await prisma.clubMember.create({
        data: {
          clubId,
          invitedEmail: cleanEmail,
          role,
          status: "PENDING_INVITE",
        },
      });
      inviteNotice = `Undangan email telah dikirim ke ${cleanEmail}. Ketika member registrasi dengan email tersebut, otomatis bergabung ke ${club.name}.`;
    }

    const hostHeader = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const protoHeader = req.headers.get("x-forwarded-proto") || "http";
    const baseOrigin = `${protoHeader}://${hostHeader}`;
    const directInviteLink = `${baseOrigin}/?clubInvite=${club.code}&inviteEmail=${encodeURIComponent(cleanEmail)}`;

    // Dispatch transactional email (Resend / Simulated)
    const emailResult = await sendClubInviteEmail({
      toEmail: cleanEmail,
      clubName: club.name,
      clubCode: club.code,
      inviterName: user.name,
      inviteLink: directInviteLink,
    });

    return NextResponse.json({
      success: true,
      member: newMember,
      notice: inviteNotice,
      isRegistered: Boolean(registeredUser),
      inviteLink: directInviteLink,
      emailResult,
      invitationDetails: {
        to: cleanEmail,
        clubName: club.name,
        inviteCode: club.code,
        invitedBy: user.name,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal mengundang member" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clubId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: { members: true },
    });

    if (!club) {
      return NextResponse.json({ error: "Club tidak ditemukan" }, { status: 404 });
    }

    const isOwner = club.ownerId === user.id;
    const callerMember = club.members.find((m) => m.userId === user.id);
    const isAdmin = isOwner || callerMember?.role === "ADMIN";

    if (!isAdmin) {
      return NextResponse.json({ error: "Hanya Admin atau Owner yang dapat mengubah role member" }, { status: 403 });
    }

    const { memberId, newRole } = await req.json();

    const targetMember = club.members.find((m) => m.id === memberId);
    if (!targetMember) {
      return NextResponse.json({ error: "Member tidak ditemukan di club ini" }, { status: 404 });
    }

    // Role: OWNER (Transfer ownership)
    if (newRole === "OWNER") {
      if (!isOwner) {
        return NextResponse.json({ error: "Hanya Owner saat ini yang dapat mentransfer kepemilikan club" }, { status: 403 });
      }

      if (!targetMember.userId) {
        return NextResponse.json({ error: "Member harus sudah terdaftar dan aktif untuk menjadi Owner" }, { status: 400 });
      }

      // 1. Update club ownerId to targetMember.userId
      await prisma.club.update({
        where: { id: clubId },
        data: { ownerId: targetMember.userId },
      });

      // 2. Ensure targetMember role is ADMIN in ClubMember
      await prisma.clubMember.update({
        where: { id: targetMember.id },
        data: { role: "ADMIN" },
      });

      // 3. Former owner remains ADMIN in ClubMember
      if (callerMember) {
        await prisma.clubMember.update({
          where: { id: callerMember.id },
          data: { role: "ADMIN" },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Kepemilikan club berhasil ditransfer ke ${targetMember.invitedEmail}`,
      });
    }

    // Role: ADMIN or MEMBER
    if (newRole === "ADMIN" || newRole === "MEMBER") {
      // Cannot demote owner
      if (targetMember.userId === club.ownerId && newRole === "MEMBER") {
        return NextResponse.json({ error: "Owner club tidak dapat diubah menjadi member biasa. Transfer kepemilikan terlebih dahulu." }, { status: 400 });
      }

      await prisma.clubMember.update({
        where: { id: memberId },
        data: { role: newRole },
      });

      return NextResponse.json({
        success: true,
        message: `Role member berhasil diubah menjadi ${newRole}`,
      });
    }

    return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal mengubah role member" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clubId } = await params;
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json({ error: "memberId parameter dibutuhkan" }, { status: 400 });
    }

    await prisma.clubMember.delete({
      where: { id: memberId, clubId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menghapus member" }, { status: 500 });
  }
}
