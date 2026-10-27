import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ProductSchema } from "@/lib/validations";
import { Prisma } from "@prisma/client";

// GET /api/products
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get("sellerId");
    const country = searchParams.get("country");
    const category = searchParams.get("category");
    const q = searchParams.get("q");
    const sort = searchParams.get("sort") || "newest";
    const status = searchParams.get("status");

    const where: Prisma.ProductWhereInput = {};

    if (sellerId) {
      where.sellerId = sellerId;
    }

    if (status) {
      where.status = status;
    } else if (!sellerId) {
      // If public listing, default to AVAILABLE or RESERVED (not SOLD) unless specified
      where.status = { in: ["AVAILABLE", "RESERVED"] };
    }

    if (country) {
      where.originCountryCode = country.toUpperCase();
    }

    if (category) {
      where.category = {
        slug: category,
      };
    }

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
      ];
    }

    // Order by
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    if (sort === "price_asc") {
      orderBy = { price: "asc" };
    } else if (sort === "price_desc") {
      orderBy = { price: "desc" };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy,
      include: {
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        category: true,
        originCountry: true,
        seller: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                username: true,
                city: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            offers: true,
          },
        },
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET Products Error:", error);
    return NextResponse.json({ error: "Gagal memuat produk" }, { status: 500 });
  }
}

// POST /api/products
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login untuk memasang iklan pakaian" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = ProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi form gagal", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

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
      imageUrls,
      primaryImageIndex = 0,
    } = parsed.data;

    const newProduct = await prisma.product.create({
      data: {
        sellerId: user.id,
        categoryId,
        originCountryCode,
        title,
        description: description || "",
        price,
        size,
        chestWidthCm: chestWidthCm || null,
        lengthCm: lengthCm || null,
        condition,
        defectNotes: defectNotes || null,
        status: "AVAILABLE",
        city,
        canCod,
        codArea: canCod ? codArea : null,
        shippingNotes: shippingNotes || null,
        images: {
          create: imageUrls.map((url, idx) => ({
            imageUrl: url,
            sortOrder: idx,
            isPrimary: idx === primaryImageIndex,
          })),
        },
      },
    });

    return NextResponse.json({
      message: "Listing pakaian berhasil diterbitkan",
      productId: newProduct.id,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat membuat iklan" },
      { status: 500 }
    );
  }
}
