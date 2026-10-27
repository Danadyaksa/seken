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

    const { id: conversationId } = await params;
    const body = await req.json();
    const { action, courierName, trackingNumber } = body;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        product: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Percakapan tidak ditemukan" }, { status: 404 });
    }

    const isSeller = conversation.sellerId === user.id;
    const isBuyer = conversation.buyerId === user.id;

    if (!isSeller && !isBuyer && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    if (action === "update-resi") {
      if (!isSeller) {
        return NextResponse.json({ error: "Hanya penjual yang dapat menginput nomor resi pengiriman" }, { status: 403 });
      }

      if (!courierName || !trackingNumber) {
        return NextResponse.json({ error: "Nama kurir dan nomor resi wajib diisi" }, { status: 400 });
      }

      const updated = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          courierName,
          trackingNumber: trackingNumber.trim(),
          shippingStatus: "SHIPPED",
          shippedAt: new Date(),
        },
      });

      // Insert audit message into conversation
      await prisma.message.create({
        data: {
          conversationId,
          senderId: user.id,
          text: `📦 [INFORMASI PENGIRIMAN] Penjual telah mengirimkan pakaian via ${courierName} dengan No. Resi: ${trackingNumber.trim()}. Silakan pantau pengiriman hingga barang tiba.`,
        },
      });

      return NextResponse.json({
        message: "Nomor resi berhasil disimpan dan diinformasikan ke pembeli",
        conversation: updated,
      });
    }

    if (action === "confirm-delivered") {
      const updated = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          shippingStatus: "DELIVERED",
        },
      });

      // Also update product status to SOLD if not already
      await prisma.product.update({
        where: { id: conversation.productId },
        data: { status: "SOLD" },
      });

      await prisma.message.create({
        data: {
          conversationId,
          senderId: user.id,
          text: `✅ [TRANSAKSI SELESAI] Barang telah dikonfirmasi diterima dengan baik. Terima kasih telah bertransaksi di Seken.!`,
        },
      });

      return NextResponse.json({
        message: "Status transaksi berhasil diperbarui menjadi selesai (Diterima)",
        conversation: updated,
      });
    }

    return NextResponse.json({ error: "Aksi pengiriman tidak valid" }, { status: 400 });
  } catch (error) {
    console.error("Shipping update error:", error);
    return NextResponse.json({ error: "Gagal memperbarui status pengiriman" }, { status: 500 });
  }
}
