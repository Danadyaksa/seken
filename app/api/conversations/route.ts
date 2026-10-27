import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/conversations - List conversations for current user
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role"); // "buyer" | "seller"

    let whereClause: Record<string, unknown> = {
      OR: [{ buyerId: user.id }, { sellerId: user.id }],
    };

    if (role === "buyer") {
      whereClause = { buyerId: user.id };
    } else if (role === "seller") {
      whereClause = { sellerId: user.id };
    }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      orderBy: { updatedAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            status: true,
            originCountry: true,
            images: {
              take: 1,
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                username: true,
                avatarUrl: true,
                city: true,
                whatsappNumber: true,
              },
            },
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                username: true,
                avatarUrl: true,
                city: true,
                whatsappNumber: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // Also attach latest offer and block status for each conversation
    const conversationsWithOffers = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipantId = conv.buyerId === user.id ? conv.sellerId : conv.buyerId;

        const [latestOffer, blockedByMe, amIBlocked] = await Promise.all([
          prisma.offer.findFirst({
            where: {
              productId: conv.productId,
              buyerId: conv.buyerId,
              sellerId: conv.sellerId,
            },
            orderBy: { createdAt: "desc" },
          }),
          prisma.block.findUnique({
            where: {
              blockerId_blockedId: {
                blockerId: user.id,
                blockedId: otherParticipantId,
              },
            },
          }),
          prisma.block.findUnique({
            where: {
              blockerId_blockedId: {
                blockerId: otherParticipantId,
                blockedId: user.id,
              },
            },
          }),
        ]);

        return {
          ...conv,
          latestOffer,
          isBlockedByMe: !!blockedByMe,
          amIBlocked: !!amIBlocked,
        };
      })
    );

    return NextResponse.json({ conversations: conversationsWithOffers, currentUserId: user.id });
  } catch (error) {
    console.error("GET Conversations Error:", error);
    return NextResponse.json({ error: "Gagal memuat percakapan" }, { status: 500 });
  }
}

// POST /api/conversations - Send a message in a conversation
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { conversationId, text } = body;

    if (!conversationId || !text || !text.trim()) {
      return NextResponse.json(
        { error: "Pesan tidak boleh kosong" },
        { status: 400 }
      );
    }

    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv) {
      return NextResponse.json({ error: "Percakapan tidak ditemukan" }, { status: 404 });
    }

    // Verify user is either buyer or seller
    if (conv.buyerId !== user.id && conv.sellerId !== user.id) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const otherParticipantId = conv.buyerId === user.id ? conv.sellerId : conv.buyerId;

    // Check if other participant has blocked current user
    const isBlocked = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: otherParticipantId,
          blockedId: user.id,
        },
      },
    });

    if (isBlocked) {
      return NextResponse.json(
        { error: "Anda tidak dapat mengirim pesan karena pengguna ini telah memblokir akun Anda." },
        { status: 403 }
      );
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        text: text.trim(),
      },
    });

    // Touch conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Send notification to recipient
    await prisma.notification.create({
      data: {
        userId: otherParticipantId,
        title: "Pesan Baru",
        message: `${user.name}: "${text.slice(0, 45)}${text.length > 45 ? "..." : ""}"`,
        type: "NEW_MESSAGE",
        linkUrl: "/inbox",
      },
    }).catch(() => {});

    return NextResponse.json({ message });
  } catch (error) {
    console.error("POST Message Error:", error);
    return NextResponse.json({ error: "Gagal mengirim pesan" }, { status: 500 });
  }
}
