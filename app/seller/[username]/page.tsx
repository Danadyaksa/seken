import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import SellerProfileActions from "@/components/SellerProfileActions";
import { IconMapPin, IconStore } from "@/components/Icons";

export const dynamic = "force-dynamic";

interface SellerPageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function SellerPage({ params }: SellerPageProps) {
  const { username } = await params;

  // Find user by profile username or user id
  const profile = await prisma.profile.findFirst({
    where: {
      OR: [
        { username: username.toLowerCase() },
        { userId: username },
      ],
    },
    include: {
      user: {
        include: {
          sellerReviews: {
            include: {
              buyer: { include: { profile: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          products: {
            orderBy: { createdAt: "desc" },
            include: {
              originCountry: true,
              category: true,
              images: true,
              seller: { include: { profile: true } },
            },
          },
        },
      },
    },
  });

  if (!profile) {
    notFound();
  }

  const { user } = profile;
  const activeProducts = user.products.filter((p) => p.status === "AVAILABLE");
  const soldProducts = user.products.filter((p) => p.status === "SOLD");

  const totalReviews = user.sellerReviews.length;
  const avgRating =
    totalReviews > 0
      ? (user.sellerReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : "5.0";

  const followersCount = await prisma.follow.count({
    where: { followingId: user.id },
  });

  const memberSince = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(user.createdAt);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7E7E77] hover:text-[#131313] transition mb-6"
      >
        ← <span>Kembali ke Katalog Utama</span>
      </Link>

      {/* Seller Header Banner */}
      <div className="bg-white rounded-xl p-6 sm:p-7 border border-[#E8E2D8] mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={user.name}
                className="w-16 h-16 rounded-xl object-cover border border-[#E8E2D8]"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-[#131313] text-white flex items-center justify-center font-bold text-xl">
                {user.name.charAt(0)}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#131313] tracking-tight">{user.name}</h1>
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#F2EADE] text-[#4A4A48]">
                  Terverifikasi
                </span>
              </div>
              <p className="text-xs text-[#7E7E77] mt-0.5">@{profile.username}</p>

              <div className="flex items-center gap-3 mt-2 text-xs text-[#4A4A48] flex-wrap">
                <span className="flex items-center gap-1">
                  <IconMapPin className="w-3.5 h-3.5 text-[#7E7E77]" />
                  <span>{profile.city || "Indonesia"}</span>
                </span>
                <span>·</span>
                <span className="font-bold text-[#131313]">
                  ★ {avgRating} ({totalReviews} ulasan)
                </span>
                <span>·</span>
                <span className="text-[#7E7E77]">
                  Bergabung {memberSince}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Seller Actions: Follow, WhatsApp, Block */}
          <SellerProfileActions
            sellerId={user.id}
            sellerName={user.name}
            whatsappNumber={profile.whatsappNumber}
            initialFollowersCount={followersCount}
          />
        </div>

        {profile.bio && (
          <p className="mt-5 pt-5 border-t border-[#F2EADE] text-xs text-[#4A4A48] leading-relaxed max-w-2xl">
            {profile.bio}
          </p>
        )}
      </div>

      {/* Seller Active Listings Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
          <div className="flex items-center gap-2">
            <IconStore className="w-4 h-4 text-[#131313]" />
            <h2 className="text-base font-bold text-[#131313]">
              Etalase Pakaian Toko ({activeProducts.length} Aktif, {soldProducts.length} Terjual)
            </h2>
          </div>
        </div>

        {user.products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-[#E8E2D8]">
            <p className="text-xs text-[#7E7E77]">Penjual ini belum memiliki pakaian di etalase.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {user.products.map((p) => (
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
                city={p.city}
                originCountry={p.originCountry}
                category={p.category}
                images={p.images}
              />
            ))}
          </div>
        )}

        {/* Reviews Section */}
        {totalReviews > 0 && (
          <div className="mt-12 pt-8 border-t border-[#E8E2D8]">
            <h3 className="font-bold text-base text-[#131313] mb-4">
              Ulasan & Kepuasan Pembeli ({totalReviews})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {user.sellerReviews.map((rev) => (
                <div key={rev.id} className="p-4 bg-white rounded-xl border border-[#E8E2D8] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#131313]">{rev.buyer.name}</span>
                    <span className="text-amber-500 text-xs font-bold">
                      {"★".repeat(rev.rating)}
                    </span>
                  </div>
                  <p className="text-xs text-[#4A4A48] leading-relaxed">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                  <span className="text-xs text-[#7E7E77] block">
                    {new Date(rev.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
