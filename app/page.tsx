import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import ProductCard from "@/components/ProductCard";
import { IconSearch } from "@/components/Icons";
import HeroSection from "@/components/HeroSection";
import FilterBar from "@/components/FilterBar";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    country?: string;
    category?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    condition?: string;
    size?: string;
    city?: string;
    method?: string;
  }>;
}

export default async function HomePage({ searchParams }: SearchPageProps) {
  const { 
    q, 
    country, 
    category, 
    sort, 
    minPrice, 
    maxPrice, 
    condition, 
    size, 
    city, 
    method 
  } = await searchParams;

  // 1. Fetch categories & countries
  const [categories, countries] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.originCountry.findMany(),
  ]);

  // 2. Build where filter query
  const where: Prisma.ProductWhereInput = {
    status: { in: ["AVAILABLE", "RESERVED"] },
  };

  if (country) {
    where.originCountryCode = country.toUpperCase();
  }

  if (category) {
    where.category = { slug: category };
  }

  if (q && q.trim()) {
    where.OR = [
      { title: { contains: q.trim() } },
      { description: { contains: q.trim() } },
    ];
  }

  if (minPrice || maxPrice) {
    where.price = {
      ...(minPrice ? { gte: Number(minPrice) } : {}),
      ...(maxPrice ? { lte: Number(maxPrice) } : {}),
    };
  }

  if (condition) {
    where.condition = condition;
  }

  if (size) {
    where.size = { contains: size };
  }

  if (city && city.trim()) {
    where.city = { contains: city.trim() };
  }

  if (method === "cod") {
    where.canCod = true;
  } else if (method === "delivery") {
    where.shippingNotes = { not: null };
  }

  // 3. Build sorting
  const orderBy: Prisma.ProductOrderByWithRelationInput[] = [];
  if (sort === "price_asc") {
    orderBy.push({ isSpotlight: "desc" }, { price: "asc" });
  } else if (sort === "price_desc") {
    orderBy.push({ isSpotlight: "desc" }, { price: "desc" });
  } else if (sort === "popular") {
    orderBy.push({ isSpotlight: "desc" }, { viewCount: "desc" });
  } else {
    orderBy.push({ isSpotlight: "desc" }, { bumpedAt: "desc" });
  }

  // 4. Fetch listings
  const products = await prisma.product.findMany({
    where,
    orderBy,
    include: {
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
      },
      category: true,
      originCountry: true,
    },
  });

  const featuredProduct = products.find((p) => p.isSpotlight) || products[0];

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* 1. Linear-Craft Editorial Hero with GSAP & Motion Textures */}
      <HeroSection
        featuredProduct={featuredProduct}
        countries={countries}
        currentCountry={country}
        currentCategory={category}
        searchQuery={q}
      />

      {/* 2. Main Catalog Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Rich Filter Toolbar */}
        <FilterBar
          categories={categories}
          countries={countries}
          totalResults={products.length}
        />

        {/* 3. Product Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#E8E2D8] my-8 px-4">
            <div className="w-12 h-12 bg-[#FAF8F5] rounded-xl flex items-center justify-center mx-auto text-[#575752] mb-3 border border-[#E8E2D8]">
              <IconSearch className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#131313] text-base mb-1">
              Tidak Ada Pakaian Sesuai Filter
            </h3>
            <p className="text-xs text-[#575752] max-w-sm mx-auto mb-6">
              Coba ganti filter harga, ukuran, baleran asal, atau kata kunci pencarian untuk menemukan pakaian vintage lainnya.
            </p>
            <Link
              href="/"
              className="inline-flex items-center text-xs font-semibold text-[#FAF8F5] bg-[#131313] hover:bg-[#262626] active:scale-[0.98] px-4 py-2 rounded-lg transition"
            >
              Reset Semua Filter
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                price={product.price}
                size={product.size}
                chestWidthCm={product.chestWidthCm}
                lengthCm={product.lengthCm}
                condition={product.condition}
                status={product.status}
                city={product.city}
                originCountry={product.originCountry}
                category={product.category}
                images={product.images}
                isSpotlight={product.isSpotlight}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
