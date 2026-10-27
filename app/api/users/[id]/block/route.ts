import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/users/[id]/block - Check if target user is blocked by current user or vice versa
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id: targetUserId } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ isBlockedByMe: false, amIBlocked: false });
    }

    const [blockedByMe, amIBlocked] = await Promise.all([
      prisma.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: currentUser.id,
            blockedId: targetUserId,
          },
        },
      }),
      prisma.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: targetUserId,
            blockedId: currentUser.id,
          },
        },
      }),
    ]);

    return NextResponse.json({
      isBlockedByMe: !!blockedByMe,
      amIBlocked: !!amIBlocked,
    });
  } catch (error) {
    console.error("GET Block Error:", error);
    return NextResponse.json({ error: "Gagal memuat status blokir." }, { status: 500 });
  }
}

// POST /api/users/[id]/block - Toggle block / unblock
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: targetUserId } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
    }

    if (currentUser.id === targetUserId) {
      return NextResponse.json({ error: "Anda tidak dapat memblokir akun Anda sendiri." }, { status: 400 });
    }

    const existing = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: currentUser.id,
          blockedId: targetUserId,
        },
      },
    });

    if (existing) {
      // Unblock
      await prisma.block.delete({
        where: { id: existing.id },
      });

      return NextResponse.json({
        isBlocked: false,
        message: "Blokir dibatalkan. Pengguna sekarang dapat menghubungi Anda kembali.",
      });
    } else {
      // Block
      await prisma.block.create({
        data: {
          blockerId: currentUser.id,
          blockedId: targetUserId,
        },
      });

      return NextResponse.json({
        isBlocked: true,
        message: "Pengguna berhasil diblokir. Mereka tidak dapat mengirim chat atau membuat penawaran kepada Anda.",
      });
    }
  } catch (error) {
    console.error("POST Block Error:", error);
    return NextResponse.json({ error: "Gagal memproses blokir." }, { status: 500 });
  }
}
