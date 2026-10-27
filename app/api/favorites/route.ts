import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/favorites - Fetch user's wishlist
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Silakan masuk untuk melihat wishlist." }, { status: 401 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: {
            originCountry: true,
            category: true,
            images: {
              orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
            },
            seller: {
              include: { profile: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("GET Favorites Error:", error);
    return NextResponse.json({ error: "Gagal memuat wishlist." }, { status: 500 });
  }
}

// POST /api/favorites - Add or toggle favorite
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
    }

    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID diperlukan." }, { status: 400 });
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    if (existing) {
      // Toggle off / remove
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ favorited: false, message: "Dihapus dari wishlist." });
    } else {
      // Add
      await prisma.favorite.create({
        data: {
          userId: user.id,
          productId,
        },
      });
      return NextResponse.json({ favorited: true, message: "Ditambahkan ke wishlist." });
    }
  } catch (error) {
    console.error("POST Favorite Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui wishlist." }, { status: 500 });
  }
}
