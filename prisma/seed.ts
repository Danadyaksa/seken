import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding thrifting marketplace data...");

  // 1. Countries
  const countries = [
    { code: "JP", name: "Jepang", flagEmoji: "🇯🇵" },
    { code: "TH", name: "Thailand", flagEmoji: "🇹🇭" },
    { code: "CN", name: "China", flagEmoji: "🇨🇳" },
    { code: "ID", name: "Indonesia", flagEmoji: "🇮🇩" },
    { code: "US", name: "Amerika Serikat", flagEmoji: "🇺🇸" },
  ];

  for (const c of countries) {
    await prisma.originCountry.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }

  // 2. Categories
  const categories = [
    { name: "Jaket, Mantel & Outerwear", slug: "jaket-vintage", icon: "Shirt" },
    { name: "Kaos Vintage & Band Tees", slug: "band-tees", icon: "Flame" },
    { name: "Crewneck & Hoodie", slug: "crewneck-hoodie", icon: "Smile" },
    { name: "Kemeja, Flanel & Workshirt", slug: "flanel-workwear", icon: "Layers" },
    { name: "Celana Denim & Jeans", slug: "denim", icon: "Scissors" },
    { name: "Celana Chino, Cargo & Pendek", slug: "celana-cargo", icon: "Scissors" },
    { name: "Pakaian Wanita & Dress Vintage", slug: "pakaian-wanita", icon: "Smile" },
    { name: "Pakaian Pria & Casual", slug: "pakaian-pria", icon: "Shirt" },
    { name: "Sepatu & Sneakers Vintage", slug: "sepatu-sneakers", icon: "Package" },
    { name: "Topi, Beanie & Headwear", slug: "topi-headwear", icon: "Smile" },
    { name: "Tas, Dompet & Aksesoris", slug: "tas-aksesoris", icon: "Package" },
    { name: "Baleran Karungan & Grosir Thrift", slug: "baleran-grosir", icon: "Package" },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categories) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories[cat.slug] = record.id;
  }

  // 3. Demo Users
  const passwordHash = await bcrypt.hash("password123", 10);

  // Seller: Tokyo Thrift ID
  const seller = await prisma.user.upsert({
    where: { email: "seller@thrift.com" },
    update: {},
    create: {
      email: "seller@thrift.com",
      name: "Tokyo Thrift Bandung",
      passwordHash,
      role: "SELLER",
      profile: {
        create: {
          username: "tokyothrift_id",
          bio: "Spesialis baleran thrift Jepang & USA vintage. Kurasi grade A authentic garments. COD Dago / Dipatiukur Bandung.",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          whatsappNumber: "081298765432",
          city: "Bandung",
        },
      },
    },
  });

  // Buyer: Aksa Vintage
  const buyer = await prisma.user.upsert({
    where: { email: "buyer@thrift.com" },
    update: {},
    create: {
      email: "buyer@thrift.com",
      name: "Aksa Danadyaksa",
      passwordHash,
      role: "BUYER",
      profile: {
        create: {
          username: "aksa_vintage",
          bio: "Kolektor jacket 90s & band tees. Penggemar kultur street wear thrifting lintas negara.",
          avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          whatsappNumber: "081234567890",
          city: "Jakarta Selatan",
        },
      },
    },
  });

  // 4. Products
  const productsData = [
    {
      title: "Vintage 90s Nike Windbreaker Blue-Teal Tag Perak",
      description: "Nike sportswear windbreaker era 1990an awal. Kombinasi warna teal, biru navy, dan aksen putih. Karet pinggang dan lengan masih kencang 90%. Tag perak leher utuh made in Japan. Bahan nylon parasut adem tidak kresek bising.",
      price: 350000,
      size: "L",
      chestWidthCm: 58,
      lengthCm: 70,
      condition: "GOOD",
      defectNotes: "Pudar halus di dekat saku kiri bawah (usia vintage), tanpa noda oli atau robek sama sekali.",
      status: "AVAILABLE",
      city: "Bandung",
      canCod: true,
      codArea: "Dago & Gazibu Bandung",
      shippingNotes: "Packing polymailer aman + free sticker. JNE/J&T/Sicepat.",
      categorySlug: "jaket-vintage",
      originCountryCode: "JP",
      images: [
        "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=80",
      ],
    },
    {
      title: "Original Nirvana In Utero 1993 Repro Tag Anvil",
      description: "Kaos vintage band Nirvana artwork legendaris In Utero. Single stitch atas bawah, kain katun 100% sudah lemes enak jatuh di badan. Fading abu-abu charcoal естетис khas baleran pakaian bekas Thailand.",
      price: 220000,
      size: "XL",
      chestWidthCm: 56,
      lengthCm: 74,
      condition: "FLAWED_VINTAGE",
      defectNotes: "Sablon retak alami (cracking) dan 1 titik pinhole/lubang jarum di bagian kerah belakang, menambah nilai vintage.",
      status: "AVAILABLE",
      city: "Bandung",
      canCod: true,
      codArea: "Simpang Dago",
      shippingNotes: "Siap kirim ke seluruh Indonesia via J&T reguler/kargo.",
      categorySlug: "band-tees",
      originCountryCode: "TH",
      images: [
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80",
      ],
    },
    {
      title: "Carhartt Detroit Jacket J97 Moss Green Blanket Lined",
      description: "Holy grail workwear Carhartt Detroit warna Moss Green. Selimut lining Navajo motif tribal utuh hangat. Ritsleting heavy metal YKK kuningan original. Bahan canvas duck tebal kokoh tahan banting.",
      price: 1450000,
      size: "M",
      chestWidthCm: 60,
      lengthCm: 66,
      condition: "LIKE_NEW",
      defectNotes: "Pristine condition, tidak ada minus noda atau sobek. Leather patch dada Carhartt sangat bersih.",
      status: "AVAILABLE",
      city: "Bandung",
      canCod: false,
      shippingNotes: "Asuransi pengiriman diaktifkan gratis untuk keamanan pembeli.",
      categorySlug: "jaket-vintage",
      originCountryCode: "US",
      images: [
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80",
      ],
    },
    {
      title: "Levi's 501 Made in Japan Selvedge Denim W32 L34",
      description: "Celana denim Levi's 501 edisi selvedge line merah asli buatan pabrik Kurabo Jepang. Kancing button fly stamped kode 553. Jahitan rantai utuh di hem bawah.",
      price: 580000,
      size: "32",
      chestWidthCm: null,
      lengthCm: 104,
      condition: "GOOD",
      defectNotes: "Honeycombs dan whiskers alami di lipatan lutut belakang, bagian ujung tumit ada gesekan tipis.",
      status: "AVAILABLE",
      city: "Bandung",
      canCod: true,
      codArea: "Bandung Kota",
      shippingNotes: "Pengiriman cepat hari yang sama.",
      categorySlug: "denim",
      originCountryCode: "JP",
      images: [
        "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800&auto=format&fit=crop&q=80",
      ],
    },
    {
      title: "Stussy Stock Logo Heavyweight Crewneck Washed Pink",
      description: "Sweater crewneck Stussy bahan fleece tebal 400gsm. Warna pink pastel washed vintage baleran impor Shenzhen China. Bordir logo klasik di dada timbul rapi.",
      price: 290000,
      size: "L",
      chestWidthCm: 60,
      lengthCm: 72,
      condition: "GOOD",
      defectNotes: "Rib leher santai sedikit rileks pemakaian wajar, warna merata tidak belang.",
      status: "AVAILABLE",
      city: "Bandung",
      canCod: false,
      shippingNotes: "Bisa kirim hemat menggunakan kurir kargo atau reguler.",
      categorySlug: "crewneck-hoodie",
      originCountryCode: "CN",
      images: [
        "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=80",
      ],
    },
    {
      title: "Vintage Ralph Lauren Chaps Workshirt Flanel Tartan Navy",
      description: "Kemeja flanel tebal Chaps Ralph Lauren saku ganda di dada. Motif kotak-kotak tartan klasik perpaduan navy, hunter green, dan kuning mustard. Lembut dan hangat.",
      price: 175000,
      size: "L",
      chestWidthCm: 56,
      lengthCm: 76,
      condition: "LIKE_NEW",
      defectNotes: "Kondisi 9.5/10 seperti baru keluar toko, kancing cadangan di label samping masih ada.",
      status: "AVAILABLE",
      city: "Bandung",
      canCod: true,
      codArea: "Area Kampus ITB / UNPAD Bandung",
      shippingNotes: "Pengiriman via kurir apa saja bisa.",
      categorySlug: "flanel-workwear",
      originCountryCode: "ID",
      images: [
        "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
      ],
    },
  ];

  for (const item of productsData) {
    const { categorySlug, originCountryCode, images, ...pData } = item;
    const categoryId = createdCategories[categorySlug];

    const product = await prisma.product.create({
      data: {
        ...pData,
        sellerId: seller.id,
        categoryId,
        originCountryCode,
        images: {
          create: images.map((url, idx) => ({
            imageUrl: url,
            sortOrder: idx,
            isPrimary: idx === 0,
          })),
        },
      },
    });

    // Sample review on the first product
    if (item.originCountryCode === "JP") {
      await prisma.review.create({
        data: {
          sellerId: seller.id,
          buyerId: buyer.id,
          productId: product.id,
          rating: 5,
          comment: "Jaket Nike-nya mantap banget! Sesuai deskripsi, ukuran PxL akurat, minus pudar halus tidak keliatan. Seller responsif di WhatsApp!",
        },
      });
    }
  }

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
