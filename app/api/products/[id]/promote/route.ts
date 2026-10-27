import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const action = body.action || "bump"; // "bump" | "toggle-spotlight"

    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, sellerId: true, isSpotlight: true, title: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    if (product.sellerId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Anda tidak memiliki akses ke listing ini" }, { status: 403 });
    }

    if (action === "toggle-spotlight") {
      const updated = await prisma.product.update({
        where: { id },
        data: {
          isSpotlight: !product.isSpotlight,
        },
      });

      return NextResponse.json({
        message: updated.isSpotlight
          ? "Listing berhasil dijadikan Spotlight Koleksi Unggulan!"
          : "Listing telah dilepas dari status Spotlight",
        isSpotlight: updated.isSpotlight,
      });
    }

    // Default action: bump
    const updated = await prisma.product.update({
      where: { id },
      data: {
        bumpedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: `Iklan "${product.title}" berhasil di-bump ke urutan teratas!`,
      bumpedAt: updated.bumpedAt,
    });
  } catch (error) {
    console.error("Promote product error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem saat promosi" }, { status: 500 });
  }
}
