import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import ProductDetailClient from "@/components/ProductDetailClient";
import ProductGallery from "@/components/ProductGallery";
import { IconMapPin, IconRuler, IconAlert, IconStore, IconCheck } from "@/components/Icons";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;

  // 1. Fetch product & update view count
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      originCountry: true,
      category: true,
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
      },
      seller: {
        include: {
          profile: true,
          sellerReviews: true,
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  // Increment viewCount asynchronously
  prisma.product
    .update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => {});

  // 2. Fetch similar listings (Carousell "Similar listings" row)
  const similarProducts = await prisma.product.findMany({
    where: {
      id: { not: id },
      status: "AVAILABLE",
    },
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      originCountry: true,
      category: true,
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      seller: {
        include: {
          profile: true,
        },
      },
    },
  });

  const currentUser = await getCurrentUser();

  const formatRupiah = (val: number) => {
    if (val === 0) return "GRATIS";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getConditionInfo = (cond: string) => {
    switch (cond) {
      case "BRAND_NEW":
        return { score: "10/10", label: "Baru / Brand New with Tag (BNWT)", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
      case "LIKE_NEW":
        return { score: "9/10", label: "Seperti Baru / Like New", color: "bg-blue-100 text-blue-800 border-blue-300" };
      case "VERY_GOOD":
        return { score: "8/10", label: "Sangat Bagus / Very Good", color: "bg-teal-100 text-teal-800 border-teal-300" };
      case "GOOD":
        return { score: "7/10", label: "Cukup Bagus / Good Vintage", color: "bg-amber-100 text-amber-800 border-amber-300" };
      case "FLAWED_VINTAGE":
        return { score: "5-6/10", label: "Ada Minus / Flawed Vintage", color: "bg-rose-100 text-rose-800 border-rose-300" };
      default:
        return { score: "7/10", label: cond, color: "bg-stone-100 text-stone-800 border-stone-200" };
    }
  };

  const condInfo = getConditionInfo(product.condition);
  const reviewsCount = product.seller.sellerReviews.length;
  const avgRating =
    reviewsCount > 0
      ? (
          product.seller.sellerReviews.reduce((acc, r) => acc + r.rating, 0) / reviewsCount
        ).toFixed(1)
      : "5.0";

  // Related search pills (Carousell "What others also search for")
  const searchTags = [
    product.category.name,
    `Baleran ${product.originCountry.name}`,
    `Vintage ${product.size}`,
    `${product.category.name.split(" ")[0]} 90s`,
    "Thrift Pilihan",
    "Outerwear Archive",
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-[#7E7E77] mb-6 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-[#131313] transition font-medium">Beranda</Link>
        <span>/</span>
        <Link href={`/?category=${product.category.slug}`} className="hover:text-[#131313] transition font-medium">
          {product.category.name}
        </Link>
        <span>/</span>
        <Link href={`/?country=${product.originCountry.code}`} className="hover:text-[#131313] transition flex items-center gap-1.5 font-medium">
          <span className="px-1 py-0.5 rounded text-[10px] font-bold bg-[#F2EADE] text-[#131313]">{product.originCountry.code}</span>
          <span>Baleran {product.originCountry.name}</span>
        </Link>
        <span>/</span>
        <span className="text-[#131313] font-semibold truncate max-w-[260px]">{product.title}</span>
      </nav>

      {/* 2. Main Two-Column Layout (Carousell Screenshot 2 Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Gallery & In-Depth Details (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Interactive Photo Gallery with Cover selection indication */}
          <ProductGallery
            images={product.images}
            title={product.title}
            originCountry={product.originCountry}
            status={product.status}
          />

          {/* Sizing & Dimension Transparency Box (PxL cm) */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8E2D8] space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-[#F2EADE]">
              <IconRuler className="w-4 h-4 text-[#131313]" />
              <h3 className="font-bold text-sm text-[#131313]">
                Ukuran Riil Pakaian (PxL cm)
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E2D8]">
                <span className="text-xs text-[#7E7E77] block mb-0.5">Tag Kerah</span>
                <span className="text-base font-extrabold text-[#131313] block">{product.size}</span>
              </div>

              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E2D8]">
                <span className="text-xs text-[#7E7E77] block mb-0.5">Panjang</span>
                <span className="text-base font-extrabold text-[#131313] block tabular-nums">
                  {product.lengthCm ? `${product.lengthCm} cm` : "-"}
                </span>
              </div>

              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E2D8]">
                <span className="text-xs text-[#7E7E77] block mb-0.5">Lebar Dada</span>
                <span className="text-base font-extrabold text-[#131313] block tabular-nums">
                  {product.chestWidthCm ? `${product.chestWidthCm} cm` : "-"}
                </span>
                {product.chestWidthCm && (
                  <span className="text-[11px] text-[#7E7E77] block mt-0.5">
                    Lingkar: {product.chestWidthCm * 2} cm
                  </span>
                )}
              </div>
            </div>

            {/* Condition & Defect Notes Transparency */}
            <div className="p-3.5 rounded-xl border bg-[#FAF8F5] border-[#E8E2D8] space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-[#131313] flex items-center gap-1.5">
                  <IconAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>Kondisi & Catatan Minus Kain:</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${condInfo.color}`}>
                  {condInfo.score} · {condInfo.label}
                </span>
              </div>
              <p className="text-xs text-[#4A4A48] leading-relaxed">
                {product.defectNotes || "Tidak ada cacat atau minus kain yang teridentifikasi. Jahitan dan kain dalam kondisi terawat."}
              </p>
            </div>
          </div>

          {/* Full Description Section */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8E2D8] space-y-3 shadow-xs">
            <h3 className="font-bold text-sm text-[#131313]">Deskripsi Pakaian</h3>
            <p className="text-xs text-[#4A4A48] leading-relaxed whitespace-pre-line">
              {product.description || "Penjual tidak menyertakan deskripsi tambahan untuk produk ini. Silakan hubungi penjual via chat untuk informasi lebih lanjut."}
            </p>
          </div>

          {/* Deal Methods (Screenshot 1 & 2 Alignment) */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8E2D8] space-y-3.5 shadow-xs">
            <h3 className="font-bold text-sm text-[#131313]">Deal Methods (Metode Transaksi)</h3>
            
            <div className="space-y-3">
              {/* Meet-up */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8]">
                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs">
                  <IconCheck className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-[#131313]">Meet-up (Ketemuan Langsung / COD)</h4>
                  <p className="text-xs text-[#7E7E77] mt-0.5">
                    {product.canCod 
                      ? (product.codArea ? `Lokasi COD: ${product.codArea} (${product.city || "Domisili Penjual"})` : `Tersedia COD di area ${product.city || "Indonesia"}`)
                      : "Penjual tidak mengaktifkan COD, transaksi via ekspedisi."}
                  </p>
                </div>
              </div>

              {/* Delivery */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8]">
                <span className="p-1.5 rounded-lg bg-blue-100 text-blue-800 text-xs">
                  <IconCheck className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-[#131313]">Mailing & Delivery (Kirim via Ekspedisi)</h4>
                  <p className="text-xs text-[#7E7E77] mt-0.5">
                    {product.shippingNotes || "Pengiriman aman menggunakan ekspedisi reguler atau kargo ke seluruh Indonesia."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Meet the Seller Card (Matches Screenshot 2) */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8E2D8] space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#131313]">Meet the Seller (Profil Penjual)</h3>
              <Link
                href={`/seller/${product.seller.profile?.username || product.seller.id}`}
                className="text-xs font-bold text-[#F34431] hover:underline"
              >
                Lihat Toko &rarr;
              </Link>
            </div>

            <div className="flex items-center gap-3.5">
              {product.seller.profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.seller.profile.avatarUrl}
                  alt={product.seller.name}
                  className="w-12 h-12 rounded-xl object-cover border border-[#E8E2D8]"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[#131313] text-white flex items-center justify-center font-bold text-base">
                  {product.seller.name.charAt(0)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link
                    href={`/seller/${product.seller.profile?.username || product.seller.id}`}
                    className="font-bold text-sm text-[#131313] hover:text-[#F34431] transition truncate"
                  >
                    {product.seller.name}
                  </Link>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold rounded">
                    ✓ Verified Curator
                  </span>
                </div>
                <p className="text-xs text-[#7E7E77] truncate mt-0.5">
                  @{product.seller.profile?.username || "penjual"} · {product.seller.profile?.city || product.city || "Indonesia"}
                </p>
                <div className="flex items-center gap-3 text-xs text-[#7E7E77] mt-1">
                  <span className="text-[#131313] font-bold">★ {avgRating} ({reviewsCount} ulasan)</span>
                  <span>·</span>
                  <span className="text-emerald-700 font-semibold">Sangat Responsif</span>
                </div>
              </div>
            </div>

            {product.seller.profile?.bio && (
              <p className="text-xs text-[#4A4A48] bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E2D8] leading-relaxed">
                &ldquo;{product.seller.profile.bio}&rdquo;
              </p>
            )}
          </div>

          {/* What Others Also Search For (Carousell Tags) */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8E2D8] space-y-3 shadow-xs">
            <h3 className="font-semibold text-xs text-[#7E7E77]">
              Pencarian Terkait
            </h3>
            <div className="flex flex-wrap gap-2">
              {searchTags.map((tag, idx) => (
                <Link
                  key={idx}
                  href={`/?q=${encodeURIComponent(tag)}`}
                  className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F2EADE] text-[#131313] text-xs font-medium rounded-full border border-[#E8E2D8] transition"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Action & Pricing Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
          {/* Main Pricing & Title Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8E2D8] space-y-4 shadow-xs">
            {/* Condition badge & Country Flag */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${condInfo.color}`}>
                {condInfo.score} · {condInfo.label}
              </span>
              <span className="text-xs font-semibold text-[#7E7E77] flex items-center gap-1">
                <IconMapPin className="w-3.5 h-3.5" />
                <span>{product.city || "Indonesia"}</span>
              </span>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-black text-[#131313] tracking-tight leading-snug">
              {product.title}
            </h1>

            {/* Price Display (Handles 0 / Free) */}
            <div className="pt-2 border-t border-[#F2EADE] flex items-baseline justify-between">
              <div>
                {product.price === 0 ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[#059669] tracking-tight">
                      GRATIS
                    </span>
                    <span className="text-xs font-bold uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      FREE ITEM
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[#131313] tabular-nums tracking-tight">
                      {formatRupiah(product.price)}
                    </span>
                    <span className="text-xs text-[#7E7E77]">Bisa dinegosiasi</span>
                  </div>
                )}
              </div>

              <span className="text-[11px] text-[#A8A8A0]">
                {product.viewCount} views
              </span>
            </div>

            {/* Client Interaction Handshake (Chat WhatsApp, Make Offer, Suka, Share) */}
            <ProductDetailClient product={product} currentUser={currentUser} />
          </div>

          {/* Direct Seller Safety Tips */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] space-y-1.5 text-xs text-[#7E7E77]">
            <div className="flex items-center gap-1.5 font-bold text-[#131313]">
              <IconStore className="w-4 h-4 text-[#F34431]" />
              <span>Panduan Transaksi C2C Aman:</span>
            </div>
            <p className="leading-relaxed">
              Hubungi penjual langsung via chat WhatsApp atau lakukan janji temu (COD). Cek dimensi PxL baju dan rincian minus sebelum bertransaksi.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Similar Listings Section (Carousell Grid) */}
      {similarProducts.length > 0 && (
        <section className="mt-14 pt-8 border-t border-[#E8E2D8] space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#131313] tracking-tight">
                Similar Listings (Pakaian Serupa)
              </h2>
              <p className="text-xs text-[#7E7E77] mt-0.5">
                Koleksi pakaian thrift terkurasi dari kategori atau asal baleran yang sama
              </p>
            </div>
            <Link
              href={`/?category=${product.category.slug}`}
              className="text-xs font-bold text-[#131313] hover:text-[#F34431] transition"
            >
              Lihat Semua &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {similarProducts.map((p) => {
              const primaryImg = p.images[0]?.imageUrl || "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=400&auto=format&fit=crop&q=80";
              const pCond = getConditionInfo(p.condition);

              return (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="group bg-white rounded-xl border border-[#E8E2D8] hover:border-[#131313] overflow-hidden transition-all duration-200 flex flex-col hover:shadow-md"
                >
                  {/* Seller Mini Row */}
                  <div className="px-2.5 py-1.5 flex items-center gap-1.5 border-b border-[#FAF8F5]">
                    {p.seller.profile?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.seller.profile.avatarUrl}
                        alt={p.seller.name}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-[#131313] text-white text-[8px] flex items-center justify-center font-bold">
                        {p.seller.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-[10px] text-[#7E7E77] truncate font-medium">
                      {p.seller.profile?.username || p.seller.name}
                    </span>
                  </div>

                  {/* Thumbnail Image */}
                  <div className="relative aspect-square w-full bg-[#F2EADE] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={primaryImg}
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-1.5 left-1.5 bg-[#131313]/90 text-[#F2EADE] text-[9px] font-bold px-1.5 py-0.5 rounded">
                      {p.originCountry.code}
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1.5">
                    <div>
                      <h4 className="text-xs font-semibold text-[#131313] line-clamp-2 leading-snug group-hover:text-[#F34431] transition">
                        {p.title}
                      </h4>
                      <p className="text-[10px] text-[#7E7E77] mt-0.5">
                        Size {p.size}
                      </p>
                    </div>

                    <div className="pt-1 border-t border-[#F2EADE] flex items-baseline justify-between">
                      <span className="text-xs font-bold text-[#131313] tabular-nums">
                        {p.price === 0 ? "GRATIS" : formatRupiah(p.price)}
                      </span>
                      <span className="text-[9px] font-semibold text-[#7E7E77]">
                        {pCond.score}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
