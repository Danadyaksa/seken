"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconMapPin, IconHeart, IconHeartFilled, IconCompare } from "@/components/Icons";
import AddToWishlistModal from "@/components/AddToWishlistModal";

interface ProductImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
}

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  size: string;
  chestWidthCm?: number | null;
  lengthCm?: number | null;
  condition: string;
  status: string;
  city?: string | null;
  originCountry: {
    code: string;
    name: string;
    flagEmoji: string;
  };
  isSpotlight?: boolean;
  category: {
    name: string;
    slug: string;
  };
  images: ProductImage[];
  isFavorited?: boolean;
  onToggleFavorite?: (productId: string, newState: boolean) => void;
}

export default function ProductCard({
  id,
  title,
  price,
  size,
  chestWidthCm,
  lengthCm,
  condition,
  status,
  city,
  originCountry,
  isSpotlight,
  category,
  images,
  isFavorited = false,
  onToggleFavorite,
}: ProductCardProps) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(isFavorited);
  const [isLiking, setIsLiking] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const primaryImage =
    images.find((img) => img.isPrimary)?.imageUrl ||
    images[0]?.imageUrl ||
    "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800";

  const conditionLabels: Record<string, { label: string; style: string }> = {
    BRAND_NEW: { label: "10/10 Baru", style: "text-emerald-800 bg-emerald-50 border-emerald-200" },
    LIKE_NEW: { label: "9/10 Like New", style: "text-blue-800 bg-blue-50 border-blue-200" },
    VERY_GOOD: { label: "8/10 Very Good", style: "text-teal-800 bg-teal-50 border-teal-200" },
    GOOD: { label: "7/10 Good Vintage", style: "text-amber-800 bg-amber-50 border-amber-200" },
    FLAWED_VINTAGE: { label: "5-6/10 Minus", style: "text-rose-800 bg-rose-50 border-rose-200" },
  };

  const currentCondition = conditionLabels[condition] || {
    label: condition,
    style: "text-stone-700 bg-stone-100 border-stone-200",
  };

  const isSold = status === "SOLD";
  const isReserved = status === "RESERVED";

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLiking) return;
    setIsLiking(true);

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      });

      if (res.status === 401) {
        router.push(`/auth/login?redirect=/products/${id}`);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const nextState = data.favorited;
        setFavorited(nextState);
        if (onToggleFavorite) {
          onToggleFavorite(id, nextState);
        }
      }
    } catch (err) {
      console.error("Toggle favorite error:", err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/compare?ids=${id}`);
  };

  return (
    <>
      <Link
      href={`/products/${id}`}
      className={`group flex flex-col bg-white rounded-xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-[0_8px_24px_rgba(19,19,19,0.06)] active:scale-[0.99] ${
        isSpotlight ? "border-[#F34431]/60 ring-1 ring-[#F34431]/20 hover:border-[#F34431]" : "border-[#E8E2D8] hover:border-[#131313]"
      }`}
    >
      {/* Product Image Frame */}
      <div className="relative aspect-[4/5] bg-[#F2EADE]/40 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={primaryImage}
          alt={title}
          className={`w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02] ${
            isSold ? "grayscale opacity-50" : ""
          }`}
        />

        {/* Provenance Origin Badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#131313]/90 backdrop-blur-xs text-[#FAF8F5] text-[10px] font-medium rounded shadow-xs">
            <span className="font-bold text-[#F2EADE]">{originCountry.code}</span>
            <span className="text-[#A8A8A0]">·</span>
            <span>{originCountry.name}</span>
          </span>
        </div>

        {/* Action icons (Wishlist & Compare) on top-right */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          {/* Spotlight Badge */}
          {isSpotlight && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F34431] text-white text-[10px] font-semibold rounded shadow-xs">
              <span>★</span>
              <span>Spotlight</span>
            </span>
          )}

          {/* Quick Compare Button */}
          <button
            type="button"
            onClick={handleCompareClick}
            title="Bandingkan ukuran pakaian ini"
            className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs border border-[#E8E2D8] flex items-center justify-center text-[#575752] hover:text-[#131313] hover:bg-white shadow-xs transition cursor-pointer"
          >
            <IconCompare className="w-3.5 h-3.5" />
          </button>

          {/* Wishlist Heart Button */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            disabled={isLiking}
            title={favorited ? "Hapus dari Wishlist" : "Simpan ke Wishlist"}
            className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs border border-[#E8E2D8] flex items-center justify-center text-[#131313] hover:bg-white shadow-xs transition active:scale-90 cursor-pointer"
          >
            {favorited ? (
              <IconHeartFilled className="w-4 h-4 text-[#F34431]" />
            ) : (
              <IconHeart className="w-4 h-4 text-[#575752] group-hover:text-[#131313]" />
            )}
          </button>
        </div>

        {/* Status Overlay */}
        {(isReserved || isSold) && (
          <div className="absolute inset-0 bg-[#131313]/50 backdrop-blur-[2px] flex items-center justify-center p-3">
            <span
              className={`px-3.5 py-1.5 text-xs font-bold rounded shadow-sm ${
                isReserved
                  ? "bg-[#F34431] text-white"
                  : "bg-white text-[#131313]"
              }`}
            >
              {isReserved ? "Sedang Dibooking" : "Sudah Terjual"}
            </span>
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="p-3.5 flex-1 flex flex-col justify-between bg-white">
        <div>
          {/* Metadata Row: Category & Condition */}
          <div className="flex items-center justify-between gap-2 mb-1.5 text-[11px]">
            <span className="text-[#575752] font-medium truncate">
              {category.name}
            </span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${currentCondition.style}`}
            >
              {currentCondition.label}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-[#131313] text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-[#F34431] transition-colors mb-2">
            {title}
          </h3>
        </div>

        <div>
          {/* Real Measurements Tag (PxL) */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#131313] bg-[#F2EADE] px-2 py-1 rounded-md mb-2.5 border border-[#E8E2D8]">
            <span className="font-bold text-[#131313]">Size {size}</span>
            {chestWidthCm && lengthCm && (
              <>
                <span className="text-[#A8A8A0]">/</span>
                <span className="font-medium text-[#3D3D3A]">P {lengthCm} × L {chestWidthCm} cm</span>
              </>
            )}
          </div>

          {/* Price & Location */}
          <div className="flex items-baseline justify-between pt-2 border-t border-[#E8E2D8]">
            {price === 0 ? (
              <span className="font-bold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                GRATIS / FREE
              </span>
            ) : (
              <p className="font-bold text-sm sm:text-base text-[#131313] tabular-nums tracking-tight">
                Rp {price.toLocaleString("id-ID")}
              </p>
            )}
            {city && (
              <span className="flex items-center gap-1 text-[11px] text-[#575752]">
                <IconMapPin className="w-3 h-3 text-[#7A7A73]" />
                <span>{city}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
    <AddToWishlistModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      product={{
        id,
        title,
        price,
        size,
        imageUrl: primaryImage,
        chestWidthCm,
        lengthCm,
      }}
      onSuccessAdded={() => {
        setFavorited(true);
        if (onToggleFavorite) onToggleFavorite(id, true);
      }}
    />
  </>
);
}
