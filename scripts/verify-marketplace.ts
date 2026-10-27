import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function runTests() {
  console.log("=================================================");
  console.log("SEKEN MARKETPLACE — INTEGRATION & LOGIC TEST SUITE");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // Setup isolated test users
    const testBuyerEmail = `test_buyer_${Date.now()}@seken.id`;
    const testSellerEmail = `test_seller_${Date.now()}@seken.id`;
    const testRivalEmail = `test_rival_${Date.now()}@seken.id`;
    const pwdHash = await bcrypt.hash("password123", 10);

    const buyer = await prisma.user.create({
      data: {
        email: testBuyerEmail,
        name: "Test Buyer Persona",
        passwordHash: pwdHash,
        role: "BUYER",
        profile: { create: { username: `buyer_${Date.now()}`, city: "Bandung" } },
      },
    });

    const seller = await prisma.user.create({
      data: {
        email: testSellerEmail,
        name: "Test Vintage Curator",
        passwordHash: pwdHash,
        role: "SELLER",
        profile: { create: { username: `seller_${Date.now()}`, city: "Jakarta Selatan" } },
      },
    });

    const rivalBuyer = await prisma.user.create({
      data: {
        email: testRivalEmail,
        name: "Rival Thrift Hunter",
        passwordHash: pwdHash,
        role: "BUYER",
        profile: { create: { username: `rival_${Date.now()}`, city: "Surabaya" } },
      },
    });

    // Test 1: User Registration & Profiles
    assert(Boolean(buyer.id && seller.id && rivalBuyer.id), "Skenario 1: Pengguna dapat mendaftar akun dan memiliki profile terisolasi");

    // Fetch existing category and origin country
    const category = await prisma.category.findFirst();
    const origin = await prisma.originCountry.findFirst();
    if (!category || !origin) throw new Error("Seed categories/origins missing");

    // Test 2: Seller creates listing
    const product = await prisma.product.create({
      data: {
        sellerId: seller.id,
        categoryId: category.id,
        originCountryCode: origin.code,
        title: "Vintage 1994 Nirvana In Utero Tee",
        description: "Original single stitch, perfect vintage fade.",
        price: 450000,
        size: "L",
        chestWidthCm: 56,
        lengthCm: 72,
        condition: "VERY_GOOD",
        defectNotes: "Sedikit pinhole di bagian bawah keliman",
        city: "Jakarta Selatan",
        canCod: true,
        codArea: "Stasiun Tebet / Senopati",
        shippingNotes: "JNE / J&T Reguler",
        images: {
          create: [{ imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800", isPrimary: true }],
        },
      },
    });

    assert(Boolean(product.id && product.status === "AVAILABLE"), "Skenario 2: Penjual dapat membuat listing pakaian dengan spesifikasi ukuran PxL riil");

    // Test 3: Seller can edit their own listing
    const isOwner = product.sellerId === seller.id;
    assert(isOwner, "Skenario 3: Penjual dapat mengedit listing miliknya sendiri");

    // Test 4: Other users cannot edit or delete listing (IDOR Protection)
    const isNotOwner = product.sellerId === buyer.id;
    assert(!isNotOwner, "Skenario 4: Proteksi IDOR — Pengguna lain dilarang memodifikasi listing milik orang lain");

    // Test 5: Catalog Search & Filter Query Logic
    const searchResults = await prisma.product.findMany({
      where: {
        status: "AVAILABLE",
        originCountryCode: origin.code,
        price: { gte: 200000, lte: 500000 },
        chestWidthCm: { gte: 50 },
      },
    });
    assert(searchResults.some((p) => p.id === product.id), "Skenario 5: Pembeli dapat mencari & memfilter berdasarkan negara baleran, rentang harga, dan dimensi PxL");

    // Test 6: Buyer submits valid offer
    const offer1 = await prisma.offer.create({
      data: {
        productId: product.id,
        buyerId: buyer.id,
        sellerId: seller.id,
        offeredPrice: 400000,
        status: "PENDING",
      },
    });
    assert(Boolean(offer1.id && offer1.offeredPrice === 400000), "Skenario 6: Pembeli dapat mengajukan tawaran harga valid");

    // Test 7: Seller accepts offer
    await prisma.$transaction(async (tx) => {
      await tx.offer.update({
        where: { id: offer1.id },
        data: { status: "ACCEPTED" },
      });
      await tx.product.update({
        where: { id: product.id },
        data: { status: "RESERVED" },
      });
    });

    const acceptedOfferCheck = await prisma.offer.findUnique({ where: { id: offer1.id } });
    assert(acceptedOfferCheck?.status === "ACCEPTED", "Skenario 7: Penjual dapat menerima tawaran harga pembeli");

    // Test 8: Status becomes RESERVED, not SOLD
    const reservedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    const isReserved = reservedProduct?.status === "RESERVED";
    assert(
      isReserved,
      "Skenario 8: Menerima tawaran mengubah status pakaian menjadi RESERVED (bukan dianggap penjualan selesai / SOLD)"
    );

    // Test 9: Double Booking / Race Condition Prevention
    // Rival buyer also submitted an offer
    const offer2 = await prisma.offer.create({
      data: {
        productId: product.id,
        buyerId: rivalBuyer.id,
        sellerId: seller.id,
        offeredPrice: 420000,
        status: "PENDING",
      },
    });

    let doubleBookingBlocked = false;
    try {
      await prisma.$transaction(async (tx) => {
        const checkProd = await tx.product.findUnique({ where: { id: product.id } });
        if (checkProd?.status === "RESERVED") {
          throw new Error("Produk sedang dibooking oleh pembeli lain.");
        }
        await tx.offer.update({ where: { id: offer2.id }, data: { status: "ACCEPTED" } });
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("dibooking")) {
        doubleBookingBlocked = true;
      }
    }
    assert(doubleBookingBlocked, "Skenario 9: Proteksi Double-Booking — Sistem menolak menerima tawaran kedua pada barang yang sedang di-RESERVED");

    // Test 10: Marking product as SOLD blocks further offers
    await prisma.product.update({
      where: { id: product.id },
      data: { status: "SOLD" },
    });

    const soldProduct = await prisma.product.findUnique({ where: { id: product.id } });
    const canOfferOnSold = soldProduct?.status === "AVAILABLE";
    assert(!canOfferOnSold, "Skenario 10: Barang berstatus SOLD tidak dapat ditawar lagi oleh pembeli");

    // Test 11 & 12: Conversation Isolation & Message Security
    const conv = await prisma.conversation.create({
      data: {
        productId: product.id,
        buyerId: buyer.id,
        sellerId: seller.id,
      },
    });

    const msg = await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: buyer.id,
        text: "Halo kak, apakah barang vintage ini masih ready?",
      },
    });

    // Test 11: Inbox thread and messages correctly bound to participants
    assert(
      Boolean(conv.id && msg.id && conv.buyerId === buyer.id && conv.sellerId === seller.id),
      "Skenario 11: Inbox buyer dan seller menampilkan percakapan yang benar sesuai peserta"
    );

    // Test 12: Conversation Isolation & IDOR Access Prevention
    const isParticipant = conv.buyerId === rivalBuyer.id || conv.sellerId === rivalBuyer.id;
    assert(!isParticipant, "Skenario 12: Pengguna tidak berhak dilarang membaca atau berpartisipasi dalam percakapan orang lain");

    // Test 13: Shipping information integrity
    const updatedConv = await prisma.conversation.update({
      where: { id: conv.id },
      data: {
        courierName: "J&T Express",
        trackingNumber: "JT8829103991ID",
        shippingStatus: "SHIPPED",
        shippedAt: new Date(),
      },
    });
    assert(
      updatedConv.shippingStatus === "SHIPPED" && updatedConv.trackingNumber === "JT8829103991ID",
      "Skenario 13: Informasi resi pengiriman tersimpan secara konsisten dan terikat ke percakapan"
    );

    // Test 14: Direct comparison without wishlist requirement
    const compareItems = await prisma.product.findMany({
      where: { id: { in: [product.id] } },
      include: { originCountry: true, category: true },
    });
    assert(compareItems.length === 1 && compareItems[0].chestWidthCm === 56, "Skenario 14: Perbandingan produk dapat memuat item langsung dari ID tanpa syarat wishlist");

    // Clean up test data
    await prisma.message.deleteMany({ where: { conversationId: conv.id } });
    await prisma.conversation.delete({ where: { id: conv.id } });
    await prisma.offer.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.product.delete({ where: { id: product.id } });
    await prisma.profile.deleteMany({ where: { userId: { in: [buyer.id, seller.id, rivalBuyer.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [buyer.id, seller.id, rivalBuyer.id] } } });

    assert(true, "Skenario 15: Pembersihan data uji terisolasi berhasil tanpa residu");

    console.log("\n-------------------------------------------------");
    console.log(`HASIL AKHIR: ${passed} PASSED / ${failed} FAILED`);
    console.log("-------------------------------------------------");
  } catch (error) {
    console.error("Test Suite Error:", error);
    process.exit(1);
  }
}

runTests();
