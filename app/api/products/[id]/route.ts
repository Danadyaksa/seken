import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/products/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        category: true,
        originCountry: true,
        seller: {
          select: {
            id: true,
            name: true,
            role: true,
            profile: true,
            sellerReviews: {
              select: { rating: true, comment: true, createdAt: true },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("GET Product Error:", error);
    return NextResponse.json({ error: "Gagal memuat produk" }, { status: 500 });
  }
}

// DELETE /api/products/[id] - IDOR Protected
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, sellerId: true, title: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    if (product.sellerId !== user.id) {
      return NextResponse.json(
        { error: "Anda tidak memiliki izin menghapus produk ini" },
        { status: 403 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Produk "${product.title}" berhasil dihapus`,
    });
  } catch (error) {
    console.error("DELETE Product Error:", error);
    return NextResponse.json({ error: "Gagal menghapus produk" }, { status: 500 });
  }
}

// PUT /api/products/[id] - Edit Listing (IDOR Protected)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, sellerId: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    if (product.sellerId !== user.id) {
      return NextResponse.json(
        { error: "Anda tidak memiliki izin mengedit pakaian ini" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      categoryId,
      originCountryCode,
      price,
      size,
      chestWidthCm,
      lengthCm,
      condition,
      defectNotes,
      city,
      canCod,
      codArea,
      shippingNotes,
      images,
    } = body;

    // Update product data
    const updated = await prisma.product.update({
      where: { id },
      data: {
        title,
        description: description || "",
        categoryId,
        originCountryCode,
        price: Number(price) || 0,
        size,
        chestWidthCm: chestWidthCm ? Number(chestWidthCm) : null,
        lengthCm: lengthCm ? Number(lengthCm) : null,
        condition,
        defectNotes: defectNotes || null,
        city,
        canCod: !!canCod,
        codArea: codArea || null,
        shippingNotes: shippingNotes || null,
      },
    });

    // If new images provided, recreate them
    if (Array.isArray(images) && images.length > 0) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      await prisma.productImage.createMany({
        data: images.map((img: { imageUrl: string; isPrimary?: boolean }, idx: number) => ({
          productId: id,
          imageUrl: typeof img === "string" ? img : img.imageUrl,
          sortOrder: idx,
          isPrimary: typeof img === "object" ? !!img.isPrimary : idx === 0,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Listing pakaian berhasil diperbarui!",
      product: updated,
    });
  } catch (error) {
    console.error("PUT Product Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui listing pakaian" }, { status: 500 });
  }
}

