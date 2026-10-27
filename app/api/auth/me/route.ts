import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Fetch counts for badges
    const [unreadNotifications, favoritesCount, followingCount] = await Promise.all([
      prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),
      prisma.favorite.count({
        where: { userId: user.id },
      }),
      prisma.follow.count({
        where: { followerId: user.id },
      }),
    ]);

    return NextResponse.json({
      user: {
        ...user,
        activeMode: user.activeMode || "BUYER",
        unreadNotifications,
        favoritesCount,
        followingCount,
      },
    });
  } catch (error) {
    console.error("Auth Me Error:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
