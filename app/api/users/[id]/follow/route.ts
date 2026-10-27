import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/users/[id]/follow - Check follow status & count
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id: targetUserId } = await params;
    const currentUser = await getCurrentUser();

    let isFollowing = false;
    if (currentUser) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: targetUserId,
          },
        },
      });
      isFollowing = !!follow;
    }

    const followersCount = await prisma.follow.count({
      where: { followingId: targetUserId },
    });

    return NextResponse.json({ isFollowing, followersCount });
  } catch (error) {
    console.error("GET Follow Error:", error);
    return NextResponse.json({ error: "Gagal memuat status follow." }, { status: 500 });
  }
}

// POST /api/users/[id]/follow - Toggle follow / unfollow
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: targetUserId } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
    }

    if (currentUser.id === targetUserId) {
      return NextResponse.json({ error: "Anda tidak dapat mengikuti akun Anda sendiri." }, { status: 400 });
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUserId,
        },
      },
    });

    if (existing) {
      // Unfollow
      await prisma.follow.delete({
        where: { id: existing.id },
      });

      const followersCount = await prisma.follow.count({
        where: { followingId: targetUserId },
      });

      return NextResponse.json({
        isFollowing: false,
        followersCount,
        message: "Berhenti mengikuti toko ini.",
      });
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId: currentUser.id,
          followingId: targetUserId,
        },
      });

      // Send notification to seller
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          title: "Pengikut Baru",
          message: `${currentUser.name} mulai mengikuti toko Anda!`,
          type: "SYSTEM",
          linkUrl: `/seller/${currentUser.profile?.username || currentUser.id}`,
        },
      }).catch(() => {});

      const followersCount = await prisma.follow.count({
        where: { followingId: targetUserId },
      });

      return NextResponse.json({
        isFollowing: true,
        followersCount,
        message: "Berhasil mengikuti toko ini.",
      });
    }
  } catch (error) {
    console.error("POST Follow Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui status follow." }, { status: 500 });
  }
}
