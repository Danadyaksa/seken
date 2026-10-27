import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// PATCH /api/offers/[id] - Accept or Decline offer
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body; // "ACCEPTED", "DECLINED", or "CANCELLED"

    if (!["ACCEPTED", "DECLINED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Status tawaran tidak valid" }, { status: 400 });
    }

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: { product: true, buyer: true, seller: true },
    });

    if (!offer) {
      return NextResponse.json({ error: "Tawaran tidak ditemukan" }, { status: 404 });
    }

    // Role and permission verification
    if (status === "ACCEPTED" || status === "DECLINED") {
      if (offer.sellerId !== user.id) {
        return NextResponse.json(
          { error: "Hanya penjual yang dapat menerima atau menolak tawaran ini" },
          { status: 403 }
        );
      }
    } else if (status === "CANCELLED") {
      if (offer.buyerId !== user.id && offer.sellerId !== user.id) {
        return NextResponse.json(
          { error: "Anda tidak memiliki wewenang untuk membatalkan tawaran ini" },
          { status: 403 }
        );
      }
    }

    const { updatedOffer } = await prisma.$transaction(async (tx) => {
      // Re-query product inside transaction to prevent race conditions
      const product = await tx.product.findUnique({
        where: { id: offer.productId },
        select: { id: true, status: true, title: true },
      });

      if (!product) {
        throw new Error("Produk tidak ditemukan");
      }

      if (product.status === "SOLD") {
        throw new Error("Produk ini sudah terjual dan tidak dapat menerima tawaran lagi.");
      }

      if (status === "ACCEPTED") {
        // Check if product is already reserved or has another accepted offer
        const existingAcceptedOffer = await tx.offer.findFirst({
          where: {
            productId: offer.productId,
            status: "ACCEPTED",
            id: { not: id },
          },
        });

        if (existingAcceptedOffer || product.status === "RESERVED") {
          throw new Error("Produk ini sedang dibooking oleh pembeli lain. Batalkan kesepakatan sebelumnya terlebih dahulu.");
        }

        const updated = await tx.offer.update({
          where: { id },
          data: { status: "ACCEPTED" },
        });

        await tx.product.update({
          where: { id: offer.productId },
          data: { status: "RESERVED" },
        });

        return { updatedOffer: updated };
      } else {
        // Status DECLINED
        const updated = await tx.offer.update({
          where: { id },
          data: { status: "DECLINED" },
        });

        // If this offer was previously ACCEPTED and product was RESERVED, return to AVAILABLE if no other accepted offer exists
        if (offer.status === "ACCEPTED" && product.status === "RESERVED") {
          const otherAccepted = await tx.offer.findFirst({
            where: {
              productId: offer.productId,
              status: "ACCEPTED",
              id: { not: id },
            },
          });

          if (!otherAccepted) {
            await tx.product.update({
              where: { id: offer.productId },
              data: { status: "AVAILABLE" },
            });
          }
        }

        return { updatedOffer: updated };
      }
    });

    // Post notification message to conversation
    const conv = await prisma.conversation.findUnique({
      where: {
        productId_buyerId_sellerId: {
          productId: offer.productId,
          buyerId: offer.buyerId,
          sellerId: offer.sellerId,
        },
      },
    });

    if (conv) {
      const formattedPrice = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(offer.offeredPrice);

      const statusText =
        status === "ACCEPTED"
          ? `✅ Penjual MENYETUJUI tawaran harga ${formattedPrice}! Barang telah dibooking. Silakan koordinasi pembayaran & pengiriman via WhatsApp.`
          : `❌ Penjual MENOLAK tawaran harga ${formattedPrice}. Silakan ajukan harga lain.`;

      await prisma.message.create({
        data: {
          conversationId: conv.id,
          senderId: user.id,
          text: statusText,
        },
      });
    }

    // Send in-app notification to buyer
    await prisma.notification.create({
      data: {
        userId: offer.buyerId,
        title: status === "ACCEPTED" ? "Tawaran Anda Diterima!" : "Tawaran Ditolak",
        message:
          status === "ACCEPTED"
            ? `Penjual menyetujui tawaran Rp ${offer.offeredPrice.toLocaleString("id-ID")} untuk "${offer.product.title}". Silakan periksa inbox!`
            : `Penjual menolak tawaran untuk "${offer.product.title}".`,
        type: status === "ACCEPTED" ? "OFFER_ACCEPTED" : "OFFER_DECLINED",
        linkUrl: "/inbox",
      },
    }).catch(() => {});

    const actionText =
      status === "ACCEPTED" ? "diterima" : status === "DECLINED" ? "ditolak" : "dibatalkan";

    return NextResponse.json({
      message: `Tawaran berhasil ${actionText}`,
      offer: updatedOffer,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Gagal memperbarui tawaran";
    const isConflict =
      errorMsg.includes("sedang dibooking") ||
      errorMsg.includes("sudah terjual") ||
      errorMsg.includes("konflik");

    return NextResponse.json(
      { error: errorMsg },
      { status: isConflict ? 409 : 400 }
    );
  }
}
