import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import CompareClient from "@/components/CompareClient";
import { IconHeart, IconArrowRight, IconCompare } from "@/components/Icons";

import { Prisma } from "@prisma/client";

type ProductWithDetails = Prisma.ProductGetPayload<{
  include: {
    originCountry: true;
    category: true;
    images: true;
    seller: {
      include: {
        profile: true;
      };
    };
  };
}>;

export const dynamic = "force-dynamic";

interface ComparePageProps {
  searchParams: Promise<{
    ids?: string;
  }>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const user = await getCurrentUser();
  const { ids } = await searchParams;

  const requestedIds = ids
    ? ids
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];

  // 1. Fetch directly requested products by ID (if any)
  let directProducts: ProductWithDetails[] = [];
  if (requestedIds.length > 0) {
    directProducts = await prisma.product.findMany({
      where: { id: { in: requestedIds } },
      include: {
        originCountry: true,
        category: true,
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        },
        seller: {
          include: {
            profile: true,
          },
        },
      },
    });
    // Preserve requested order
    directProducts.sort((a, b) => requestedIds.indexOf(a.id) - requestedIds.indexOf(b.id));
  }

  // 2. Fetch user's wishlist products if logged in
  let wishlistProducts: ProductWithDetails[] = [];
  if (user) {
    const userFavorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            originCountry: true,
            category: true,
            images: {
              orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
            },
            seller: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    wishlistProducts = userFavorites.map((f) => f.product);
  }

  // 3. Fetch catalog products to populate the compare slot dropdown
  const catalogProducts = await prisma.product.findMany({
    where: { status: "AVAILABLE" },
    take: 20,
    orderBy: { bumpedAt: "desc" },
    include: {
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        take: 1,
      },
    },
  });

  // Determine initial products to compare
  let initialProducts = directProducts;
  if (initialProducts.length === 0 && wishlistProducts.length > 0) {
    initialProducts = wishlistProducts.slice(0, 2);
  }

  // Combine unique options for the "Add product to compare" dropdown
  const combinedMap = new Map<string, { id: string; title: string; price: number; images: { imageUrl: string }[] }>();
  
  // First add wishlist products (if any)
  wishlistProducts.forEach((p) => {
    combinedMap.set(p.id, {
      id: p.id,
      title: `❤️ [Wishlist] ${p.title}`,
      price: p.price,
      images: p.images.map((img) => ({ imageUrl: img.imageUrl })),
    });
  });

  // Then add catalog products
  catalogProducts.forEach((p) => {
    if (!combinedMap.has(p.id)) {
      combinedMap.set(p.id, {
        id: p.id,
        title: p.title,
        price: p.price,
        images: p.images.map((img) => ({ imageUrl: img.imageUrl })),
      });
    }
  });

  const allAvailableProducts = Array.from(combinedMap.values());

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[75vh]">
      {/* Page Header */}
      <div className="border-b border-[#E8E2D8] pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#F34431] uppercase tracking-wider mb-1 font-bold">
            <IconCompare className="w-4 h-4" />
            <span>FITUR PERBANDINGAN PAKAIAN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#131313] tracking-tight">
            Komparasi Presisi Ukuran PxL Pakaian
          </h1>
          <p className="text-xs sm:text-sm text-[#575752] mt-1 max-w-2xl leading-relaxed">
            Bandingkan hingga 3 pakaian vintage berdampingan: harga, kondisi pemakaian /10, asal baleran impor, dimensi pengukuran riil Lebar Dada (PxL), dan opsi pengiriman/COD.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {user && (
            <Link
              href="/wishlist"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F2EADE] text-[#131313] text-xs font-bold transition border border-[#E8E2D8]"
            >
              <IconHeart className="w-3.5 h-3.5 text-[#F34431]" />
              <span>Wishlist Saya</span>
            </Link>
          )}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#131313] hover:bg-[#282828] text-white text-xs font-bold transition shadow-xs"
          >
            <span>Jelajahi Katalog</span>
            <IconArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {initialProducts.length === 0 && allAvailableProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#E8E2D8] px-4 max-w-xl mx-auto">
          <div className="w-14 h-14 bg-[#F2EADE] text-[#F34431] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <IconCompare className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-[#131313] mb-2">
            Belum Ada Pakaian yang Dipilih untuk Dibandingkan
          </h2>
          <p className="text-xs sm:text-sm text-[#575752] leading-relaxed mb-6">
            Pilih tombol <strong>Bandingkan</strong> di kartu pakaian pada katalog atau halaman produk untuk langsung membandingkan spesifikasi ukuran fisik PxL.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#131313] text-white text-xs font-bold hover:bg-[#F34431] transition shadow-xs"
            >
              <span>Jelajahi Katalog Pakaian</span>
              <IconArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <CompareClient
          initialProducts={initialProducts}
          allAvailableProducts={allAvailableProducts}
        />
      )}
    </main>
  );
}
