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
      return NextResponse.json({ error: "Silakan masuk untuk melaporkan listing ini" }, { status: 401 });
    }

    const { id: productId } = await params;
    const body = await req.json();
    const { reason, notes } = body;

    if (!reason) {
      return NextResponse.json({ error: "Alasan pelaporan wajib dipilih" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, title: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    const report = await prisma.report.create({
      data: {
        productId,
        reporterId: user.id,
        reason,
        notes: notes ? notes.trim() : null,
      },
    });

    return NextResponse.json({
      message: "Laporan Anda telah berhasil dikirim ke tim kurasi & moderasi untuk ditinjau.",
      reportId: report.id,
    });
  } catch (error) {
    console.error("Report product error:", error);
    return NextResponse.json({ error: "Gagal mengirim laporan" }, { status: 500 });
  }
}
