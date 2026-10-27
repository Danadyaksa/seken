import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!["AVAILABLE", "RESERVED", "SOLD", "ARCHIVED"].includes(status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    // IDOR Check: Ensure user is the owner of the product
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    if (product.sellerId !== user.id) {
      return NextResponse.json(
        { error: "Anda tidak memiliki izin mengubah status produk ini" },
        { status: 403 }
      );
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      message: `Status produk berhasil diubah menjadi ${status}`,
      product: updated,
    });
  } catch (error) {
    console.error("Status Update Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui status" }, { status: 500 });
  }
}
