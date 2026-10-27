import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { IconStore, IconStar, IconArrowRight } from "@/components/Icons";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function FollowingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login?redirect=/following");
  }

  // Fetch followed sellers
  const follows = await prisma.follow.findMany({
    where: { followerId: user.id },
    include: {
      following: {
        include: {
          profile: true,
          sellerReviews: true,
          products: {
            where: { status: "AVAILABLE" },
            take: 4,
            orderBy: { createdAt: "desc" },
            include: {
              originCountry: true,
              category: true,
              images: {
                orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // If user follows no one, fetch suggested sellers
  let suggestedSellers: Array<{
    id: string;
    name: string;
    profile: { username: string; city: string | null; avatarUrl: string | null } | null;
    sellerReviews: { rating: number }[];
    products: { id: string }[];
  }> = [];

  if (follows.length === 0) {
    suggestedSellers = await prisma.user.findMany({
      where: {
        id: { not: user.id },
        products: { some: {} },
      },
      take: 4,
      include: {
        profile: true,
        sellerReviews: true,
        products: { select: { id: true } },
      },
    });
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[75vh]">
      {/* Page Header */}
      <div className="border-b border-[#E8E2D8] pb-6 mb-8">
        <div className="flex items-center gap-2 text-xs font-mono text-[#F34431] uppercase tracking-wider mb-1">
          <span>MODE PEMBELI</span>
          <span>·</span>
          <span>TOKO LANGGANAN</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#131313] tracking-tight">
          Toko & Kolektor yang Anda Ikuti
        </h1>
        <p className="text-xs sm:text-sm text-[#575752] mt-1">
          Pantau rilisan pakaian vintage terbaru dari toko baleran impor langganan Anda secara prioritas.
        </p>
      </div>

      {follows.length === 0 ? (
        <div className="space-y-8">
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#E8E2D8] px-4">
            <div className="w-12 h-12 bg-[#F2EADE] rounded-xl flex items-center justify-center mx-auto text-[#7A7A73] mb-3">
              <IconStore className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#131313] mb-1">
              Anda Belum Mengikuti Toko Apapun
            </h3>
            <p className="text-xs text-[#575752] max-w-md mx-auto mb-4">
              Ikuti toko vintage favorit untuk mendapatkan pembaruan koleksi baleran baru di feed Anda.
            </p>
          </div>

          {/* Suggested Sellers */}
          {suggestedSellers.length > 0 && (
            <div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-[#73736C] font-bold mb-4">
                REKOMENDASI TOKO VINTAGE TERVERIFIKASI
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {suggestedSellers.map((seller) => {
                  const ratingAvg =
                    seller.sellerReviews.length > 0
                      ? (seller.sellerReviews.reduce((a, b) => a + b.rating, 0) / seller.sellerReviews.length).toFixed(1)
                      : "5.0";

                  return (
                    <div key={seller.id} className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-[#131313] text-white flex items-center justify-center font-bold text-sm overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={seller.profile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${seller.name}`}
                              alt={seller.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-[#131313] truncate">{seller.name}</h4>
                            <span className="text-[11px] font-mono text-[#73736C]">@{seller.profile?.username}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#575752] mb-4">
                          <span className="flex items-center gap-1 font-semibold text-[#131313]">
                            <IconStar className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>{ratingAvg}</span>
                          </span>
                          <span>·</span>
                          <span>{seller.products.length} Pakaian</span>
                        </div>
                      </div>

                      <Link
                        href={`/seller/${seller.profile?.username || seller.id}`}
                        className="w-full text-center py-2 rounded-lg bg-[#131313] hover:bg-[#F34431] text-white text-xs font-bold transition shadow-xs"
                      >
                        Kunjungi Toko
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Followed Stores with their listings */
        <div className="space-y-12">
          {follows.map(({ following: seller }) => {
            const ratingAvg =
              seller.sellerReviews.length > 0
                ? (seller.sellerReviews.reduce((a, b) => a + b.rating, 0) / seller.sellerReviews.length).toFixed(1)
                : "5.0";

            return (
              <div key={seller.id} className="bg-white rounded-2xl border border-[#E8E2D8] p-5 sm:p-6 shadow-xs">
                {/* Store Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#131313] text-white overflow-hidden shadow-xs shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={seller.profile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${seller.name}`}
                        alt={seller.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-[#131313]">{seller.name}</h3>
                        <span className="text-xs font-mono text-[#73736C]">@{seller.profile?.username}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-[#575752] mt-0.5">
                        <span className="flex items-center gap-1 font-semibold text-[#131313]">
                          <IconStar className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{ratingAvg}</span>
                        </span>
                        <span>·</span>
                        <span>{seller.profile?.city || "Indonesia"}</span>
                        <span>·</span>
                        <span className="text-[#059669] font-medium">Sedang Mengikuti</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/seller/${seller.profile?.username || seller.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#131313] hover:bg-[#131313] hover:text-white text-xs font-bold transition text-[#131313]"
                  >
                    <span>Lihat Semua Pakaian ({seller.products.length})</span>
                    <IconArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Product Grid from this Seller */}
                {seller.products.length === 0 ? (
                  <p className="text-xs text-[#73736C] py-4 text-center italic">
                    Toko ini belum memiliki pakaian baru yang tersedia saat ini.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {seller.products.map((p) => (
                      <ProductCard
                        key={p.id}
                        id={p.id}
                        title={p.title}
                        price={p.price}
                        size={p.size}
                        chestWidthCm={p.chestWidthCm}
                        lengthCm={p.lengthCm}
                        condition={p.condition}
                        status={p.status}
                        city={seller.profile?.city}
                        originCountry={p.originCountry}
                        category={p.category}
                        images={p.images}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
