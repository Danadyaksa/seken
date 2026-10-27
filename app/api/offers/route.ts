import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { OfferSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login untuk mengajukan penawaran harga" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = OfferSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data penawaran tidak valid", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { productId, offeredPrice } = parsed.data;

    // Find product & verify
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Pakaian thrift tidak ditemukan" },
        { status: 404 }
      );
    }

    if (product.sellerId === user.id) {
      return NextResponse.json(
        { error: "Anda tidak dapat menawar barang dagangan milik sendiri" },
        { status: 400 }
      );
    }

    if (product.status !== "AVAILABLE") {
      return NextResponse.json(
        { error: "Barang ini sudah tidak tersedia untuk ditawar" },
        { status: 400 }
      );
    }

    // Check if seller has blocked this user
    const isBlocked = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: product.sellerId,
          blockedId: user.id,
        },
      },
    });

    if (isBlocked) {
      return NextResponse.json(
        { error: "Anda telah diblokir oleh penjual ini dan tidak dapat membuat penawaran." },
        { status: 403 }
      );
    }

    // Create offer
    const offer = await prisma.offer.create({
      data: {
        productId: product.id,
        buyerId: user.id,
        sellerId: product.sellerId,
        offeredPrice,
        status: "PENDING",
      },
    });

    // Notify seller
    await prisma.notification.create({
      data: {
        userId: product.sellerId,
        title: "Penawaran Masuk",
        message: `${user.name} menawar "${product.title}" seharga Rp ${offeredPrice.toLocaleString("id-ID")}`,
        type: "OFFER_RECEIVED",
        linkUrl: "/inbox",
      },
    }).catch(() => {});

    // Find or create conversation
    let conv = await prisma.conversation.findUnique({
      where: {
        productId_buyerId_sellerId: {
          productId: product.id,
          buyerId: user.id,
          sellerId: product.sellerId,
        },
      },
    });

    if (!conv) {
      conv = await prisma.conversation.create({
        data: {
          productId: product.id,
          buyerId: user.id,
          sellerId: product.sellerId,
        },
      });
    }

    // Add automated offer message
    const formattedPrice = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(offeredPrice);

    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: user.id,
        text: `🏷️ Saya mengajukan penawaran harga sebesar ${formattedPrice}. Apakah bisa deal?`,
      },
    });

    return NextResponse.json({
      message: "Tawaran berhasil dikirimkan ke penjual",
      offer,
    });
  } catch (error) {
    console.error("Offer Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat mengirim penawaran" },
      { status: 500 }
    );
  }
}
