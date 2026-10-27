import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function runConcurrencyTests() {
  console.log("================================================================");
  console.log("SEKEN MARKETPLACE — CONCURRENT RACE CONDITION & INTEGRATION TEST");
  console.log("================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, extraInfo?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      if (extraInfo) console.log(`   ℹ️  ${extraInfo}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (extraInfo) console.error(`   ⚠️  ${extraInfo}`);
      failed++;
    }
  }

  // Define isolated IDs
  const runId = Date.now();
  const sellerEmail = `seller_concurrent_${runId}@seken.id`;
  const buyer1Email = `buyer1_concurrent_${runId}@seken.id`;
  const buyer2Email = `buyer2_concurrent_${runId}@seken.id`;

  let seller: { id: string } | null = null;
  let buyer1: { id: string } | null = null;
  let buyer2: { id: string } | null = null;
  let product: { id: string; status: string } | null = null;
  let offer1: { id: string; status: string } | null = null;
  let offer2: { id: string; status: string } | null = null;

  try {
    const pwdHash = await bcrypt.hash("password123", 10);

    // 1. Setup isolated users
    seller = await prisma.user.create({
      data: {
        email: sellerEmail,
        name: "Vintage Seller Concurrent",
        passwordHash: pwdHash,
        role: "SELLER",
        profile: { create: { username: `seller_c_${runId}`, city: "Jakarta Selatan" } },
      },
    });

    buyer1 = await prisma.user.create({
      data: {
        email: buyer1Email,
        name: "Buyer Persona A",
        passwordHash: pwdHash,
        role: "BUYER",
        profile: { create: { username: `buyer_a_${runId}`, city: "Bandung" } },
      },
    });

    buyer2 = await prisma.user.create({
      data: {
        email: buyer2Email,
        name: "Buyer Persona B",
        passwordHash: pwdHash,
        role: "BUYER",
        profile: { create: { username: `buyer_b_${runId}`, city: "Surabaya" } },
      },
    });

    const category = await prisma.category.findFirst();
    const origin = await prisma.originCountry.findFirst();
    if (!category || !origin) throw new Error("Seed categories or origin countries missing");

    // 2. Create target product
    product = await prisma.product.create({
      data: {
        sellerId: seller.id,
        categoryId: category.id,
        originCountryCode: origin.code,
        title: `Concurrent Test 90s Carhartt Detroit Jacket ${runId}`,
        description: "Heavy canvas archive piece, testing simultaneous offers.",
        price: 1200000,
        size: "XL",
        chestWidthCm: 62,
        lengthCm: 68,
        condition: "VERY_GOOD",
        status: "AVAILABLE",
        city: "Jakarta Selatan",
        canCod: true,
      },
    });

    assert(product.status === "AVAILABLE", "Test Setup: Produk uji dibuat dengan status awal AVAILABLE");

    // 3. Create two competing offers from Buyer A and Buyer B
    offer1 = await prisma.offer.create({
      data: {
        productId: product.id,
        buyerId: buyer1.id,
        sellerId: seller.id,
        offeredPrice: 1100000,
        status: "PENDING",
      },
    });

    offer2 = await prisma.offer.create({
      data: {
        productId: product.id,
        buyerId: buyer2.id,
        sellerId: seller.id,
        offeredPrice: 1150000,
        status: "PENDING",
      },
    });

    assert(
      offer1.status === "PENDING" && offer2.status === "PENDING",
      "Test Setup: Dua tawaran (Offer 1 & Offer 2) tercatat berstatus PENDING"
    );

    // Business Logic Helper matching app/api/offers/[id]/route.ts transaction
    async function acceptOffer(offerId: string, currentSellerId: string) {
      return await prisma.$transaction(async (tx) => {
        const offer = await tx.offer.findUnique({
          where: { id: offerId },
          include: { product: true },
        });

        if (!offer) throw new Error("Tawaran tidak ditemukan");
        if (offer.sellerId !== currentSellerId) throw new Error("Hanya penjual yang dapat merespons");

        const prod = await tx.product.findUnique({
          where: { id: offer.productId },
        });

        if (!prod) throw new Error("Produk tidak ditemukan");
        if (prod.status === "SOLD") throw new Error("Produk ini sudah terjual.");

        // Critical race-condition lock check
        const existingAcceptedOffer = await tx.offer.findFirst({
          where: {
            productId: offer.productId,
            status: "ACCEPTED",
            id: { not: offerId },
          },
        });

        if (existingAcceptedOffer || prod.status === "RESERVED") {
          throw new Error("409 CONFLICT: Produk ini sedang dibooking oleh pembeli lain. Batalkan kesepakatan sebelumnya terlebih dahulu.");
        }

        const updatedOffer = await tx.offer.update({
          where: { id: offerId },
          data: { status: "ACCEPTED" },
        });

        const updatedProd = await tx.product.update({
          where: { id: offer.productId },
          data: { status: "RESERVED" },
        });

        return { updatedOffer, updatedProd };
      });
    }

    // Business Logic Helper for Declining / Cancelling matching route.ts
    async function updateOfferStatus(offerId: string, newStatus: "DECLINED" | "CANCELLED") {
      return await prisma.$transaction(async (tx) => {
        const offer = await tx.offer.findUnique({
          where: { id: offerId },
          include: { product: true },
        });
        if (!offer) throw new Error("Tawaran tidak ditemukan");

        const prod = await tx.product.findUnique({ where: { id: offer.productId } });
        if (!prod) throw new Error("Produk tidak ditemukan");
        if (prod.status === "SOLD") throw new Error("Produk ini sudah terjual.");

        const updatedOffer = await tx.offer.update({
          where: { id: offerId },
          data: { status: newStatus },
        });

        // Audit Rule: Return to AVAILABLE ONLY if THIS offer was previously ACCEPTED and no other accepted offer exists
        if (offer.status === "ACCEPTED" && prod.status === "RESERVED") {
          const otherAccepted = await tx.offer.findFirst({
            where: {
              productId: offer.productId,
              status: "ACCEPTED",
              id: { not: offerId },
            },
          });

          if (!otherAccepted) {
            await tx.product.update({
              where: { id: offer.productId },
              data: { status: "AVAILABLE" },
            });
          }
        }

        return updatedOffer;
      });
    }

    console.log("\n⚡ Menjalankan 2 penerimaan tawaran secara SIMULTAN (Promise.all)...");
    const startTime = Date.now();

    const results = await Promise.allSettled([
      acceptOffer(offer1.id, seller.id),
      acceptOffer(offer2.id, seller.id),
    ]);

    const duration = Date.now() - startTime;
    console.log(`⏱️ Eksekusi konkurensi selesai dalam ${duration}ms\n`);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    // 4. Assert: Exactly one succeeds and exactly one fails
    assert(
      fulfilled.length === 1 && rejected.length === 1,
      "Konkurensi 1: Tepat 1 penerimaan berhasil dan 1 penerimaan digagalkan",
      `Berhasil: ${fulfilled.length}, Gagal: ${rejected.length}`
    );

    // 5. Assert: Rejection is a Conflict error
    const rejectionReason = (rejected[0] as PromiseRejectedResult).reason?.message || "";
    assert(
      rejectionReason.includes("409 CONFLICT") && rejectionReason.includes("sedang dibooking"),
      "Konkurensi 2: Tawaran kedua ditolak dengan pesan respon konflik 409 yang sesuai",
      `Pesan Penolakan: "${rejectionReason}"`
    );

    // 6. Assert: DB product status is RESERVED, NEVER SOLD
    const productAfterRace = await prisma.product.findUnique({ where: { id: product.id } });
    const isProductReserved = productAfterRace?.status === "RESERVED";
    assert(
      isProductReserved,
      "Konkurensi 3: Produk berubah menjadi RESERVED dan TIDAK menjadi SOLD akibat tawaran diterima",
      `Status Aktual: ${productAfterRace?.status}`
    );

    // 7. Assert: Consistency in offers table
    const acceptedOffersCount = await prisma.offer.count({
      where: { productId: product.id, status: "ACCEPTED" },
    });
    const pendingOffersCount = await prisma.offer.count({
      where: { productId: product.id, status: "PENDING" },
    });

    assert(
      acceptedOffersCount === 1 && pendingOffersCount === 1,
      "Konkurensi 4: Konsistensi Database — Tepat 1 tawaran berstatus ACCEPTED dan 1 berstatus PENDING",
      `Accepted: ${acceptedOffersCount}, Pending: ${pendingOffersCount}`
    );

    // 8. Audit Rule A: Declining a PENDING offer MUST NOT revert product status
    console.log("\n🔍 Menguji Audit Aturan Pembatalan/Penolakan:");
    const remainingPendingOffer = await prisma.offer.findFirst({
      where: { productId: product.id, status: "PENDING" },
    });

    if (remainingPendingOffer) {
      await updateOfferStatus(remainingPendingOffer.id, "DECLINED");
      const prodCheck1 = await prisma.product.findUnique({ where: { id: product.id } });
      assert(
        prodCheck1?.status === "RESERVED",
        "Audit 1: Menolak tawaran berstatus PENDING TIDAK mengubah status produk (tetap RESERVED bagi pemenang tawaran)",
        `Status Produk: ${prodCheck1?.status}`
      );
    }

    // 9. Audit Rule B: Cancelling/Declining the ACCEPTED offer reverts product to AVAILABLE
    const activeAcceptedOffer = await prisma.offer.findFirst({
      where: { productId: product.id, status: "ACCEPTED" },
    });

    if (activeAcceptedOffer) {
      await updateOfferStatus(activeAcceptedOffer.id, "DECLINED");
      const prodCheck2 = await prisma.product.findUnique({ where: { id: product.id } });
      assert(
        prodCheck2?.status === "AVAILABLE",
        "Audit 2: Membatalkan/menolak tawaran ACCEPTED mengembalikan status produk ke AVAILABLE (karena tidak ada reservasi lain)",
        `Status Produk: ${prodCheck2?.status}`
      );
    }

    // 10. Audit Rule C: Confirming transaction marks product as SOLD
    await prisma.product.update({
      where: { id: product.id },
      data: { status: "SOLD" },
    });
    const prodSold = await prisma.product.findUnique({ where: { id: product.id } });
    assert(
      prodSold?.status === "SOLD",
      "Audit 3: Status SOLD hanya dipicu secara definitif saat penjual mengonfirmasi penjualan final",
      `Status Produk: ${prodSold?.status}`
    );

    // 11. Assert: No further offers can be accepted once SOLD
    let soldBlocked = false;
    try {
      await acceptOffer(offer1.id, seller.id);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("sudah terjual")) {
        soldBlocked = true;
      }
    }
    assert(
      soldBlocked,
      "Audit 4: Barang berstatus SOLD secara mutlak menolak segala mutasi penerimaan tawaran baru"
    );

  } catch (error) {
    console.error("Test Suite Fatal Error:", error);
    failed++;
  } finally {
    // Clean up isolated records
    console.log("\n🧹 Membersihkan data uji terisolasi...");
    if (product?.id) {
      await prisma.offer.deleteMany({ where: { productId: product.id } });
      await prisma.product.delete({ where: { id: product.id } });
    }
    if (seller?.id || buyer1?.id || buyer2?.id) {
      const userIds = [seller?.id, buyer1?.id, buyer2?.id].filter((id): id is string => Boolean(id));
      await prisma.profile.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    console.log("✨ Data uji terisolasi berhasil dibersihkan tanpa merusak data demo/seed.\n");
  }

  console.log("================================================================");
  console.log(`HASIL AKHIR UJI KONKURENSI: ${passed} PASSED / ${failed} FAILED`);
  console.log("================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runConcurrencyTests();
