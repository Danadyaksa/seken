"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconHeartFilled, IconX, IconCompare } from "@/components/Icons";

interface AddToWishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    title: string;
    price: number;
    size: string;
    imageUrl: string;
    chestWidthCm?: number | null;
    lengthCm?: number | null;
  };
  onSuccessAdded?: () => void;
}

export default function AddToWishlistModal({
  isOpen,
  onClose,
  product,
  onSuccessAdded,
}: AddToWishlistModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAddAndCompare = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });

      if (res.status === 401) {
        router.push(`/auth/login?redirect=/products/${product.id}`);
        return;
      }

      if (res.ok) {
        if (onSuccessAdded) onSuccessAdded();
        onClose();
        router.push(`/compare?ids=${product.id}`);
      }
    } catch (err) {
      console.error("Add to wishlist error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (val: number) => {
    if (val === 0) return "GRATIS";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E8E2D8] shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-[#7A7A73] hover:text-[#131313] hover:bg-[#F2EADE] transition cursor-pointer"
        >
          <IconX className="w-4 h-4" />
        </button>

        {/* Header Icon */}
        <div className="w-12 h-12 rounded-xl bg-[#F2EADE] flex items-center justify-center text-[#F34431] mb-4">
          <IconCompare className="w-6 h-6" />
        </div>

        {/* Title & Info */}
        <h3 className="text-base font-bold text-[#131313] mb-1.5">
          Simpan ke Wishlist untuk Membandingkan
        </h3>
        <p className="text-xs text-[#575752] leading-relaxed mb-4">
          Fitur komparasi ukuran riil (PxL) khusus membandingkan pakaian vintage yang telah Anda simpan di <strong>Wishlist</strong>.
        </p>

        {/* Product Card Preview */}
        <div className="flex items-center gap-3 p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D8] mb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-14 h-16 rounded-lg object-cover border border-[#E8E2D8] shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-[#131313] truncate">{product.title}</h4>
            <p className="text-xs font-bold text-[#F34431] mt-0.5">{formatPrice(product.price)}</p>
            <div className="flex items-center gap-1.5 text-[10px] text-[#575752] mt-1">
              <span className="font-semibold bg-[#F2EADE] px-1.5 py-0.5 rounded text-[#131313]">
                Size {product.size}
              </span>
              {product.lengthCm && product.chestWidthCm && (
                <span>P {product.lengthCm} × L {product.chestWidthCm} cm</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleAddAndCompare}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#131313] hover:bg-[#262626] active:scale-[0.98] text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
          >
            <IconHeartFilled className="w-3.5 h-3.5 text-[#F34431]" />
            <span>{loading ? "Menyimpan ke Wishlist..." : "Simpan ke Wishlist & Bandingkan Sekarang"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-[#7A7A73] hover:text-[#131313] hover:bg-[#F2EADE]/50 transition cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
