"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { IconHeart, IconArrowRight, IconTag, IconCompare } from "@/components/Icons";
import ProductCard from "@/components/ProductCard";

interface FavoriteProduct {
  id: string;
  productId: string;
  product: {
    id: string;
    title: string;
    price: number;
    size: string;
    chestWidthCm?: number | null;
    lengthCm?: number | null;
    condition: string;
    status: string;
    city?: string | null;
    isSpotlight?: boolean;
    originCountry: {
      code: string;
      name: string;
      flagEmoji: string;
    };
    category: {
      name: string;
      slug: string;
    };
    images: {
      id: string;
      imageUrl: string;
      isPrimary: boolean;
    }[];
  };
}

export default function WishlistPage() {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function fetchFavorites() {
      try {
        const res = await fetch("/api/favorites");
        if (ignore) return;
        if (res.status === 401) {
          setIsAuth(false);
          setLoading(false);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setFavorites(data.favorites || []);
        }
      } catch (err) {
        console.error("Fetch wishlist error:", err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchFavorites();

    return () => {
      ignore = true;
    };
  }, []);

  if (!isAuth) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#F2EADE] text-[#131313] flex items-center justify-center mx-auto mb-4">
          <IconHeart className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[#131313] mb-2">
          Masuk untuk Melihat Wishlist Anda
        </h1>
        <p className="text-xs sm:text-sm text-[#575752] max-w-md mx-auto mb-6">
          Simpan pakaian thrift vintage incaran Anda dan pantau ketersediaan serta pergerakan harganya.
        </p>
        <Link
          href="/auth/login?redirect=/wishlist"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#131313] text-[#FAF8F5] text-xs font-bold hover:bg-[#282828] transition"
        >
          <span>Masuk ke Akun Seken.</span>
          <IconArrowRight className="w-4 h-4 text-[#F34431]" />
        </Link>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[70vh]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#F34431] uppercase tracking-wider mb-1">
            <span>MODE PEMBELI</span>
            <span>·</span>
            <span>KOLEKSI INCINTAAN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#131313] tracking-tight">
            Wishlist Pakaian Saya
          </h1>
          <p className="text-xs sm:text-sm text-[#575752] mt-1">
            Daftar pakaian vintage yang Anda simpan untuk dibeli atau dinegosiasikan dengan penjual.
          </p>
        </div>

        <div className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-[#F2EADE] text-[#131313] border border-[#E8E2D8] self-start sm:self-auto">
          {favorites.length} Pakaian Tersimpan
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] bg-[#F2EADE]/60 rounded-xl" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#E8E2D8] px-4">
          <div className="w-14 h-14 bg-[#F2EADE] rounded-2xl flex items-center justify-center mx-auto text-[#7A7A73] mb-4">
            <IconTag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#131313] mb-1">Wishlist Anda Masih Kosong</h3>
          <p className="text-xs sm:text-sm text-[#575752] max-w-md mx-auto mb-6">
            Jelajahi pakaian baleran vintage Jepang, Thailand, USA, dan China, lalu tekan ikon hati pada pakaian yang Anda minati.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#131313] text-[#FAF8F5] text-xs font-bold hover:bg-[#F34431] transition shadow-xs"
          >
            <span>Jelajahi Katalog Vintage</span>
            <IconArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Compare Wishlist Items Banner */}
          {favorites.length >= 2 && (
            <div className="p-4 rounded-xl bg-white border border-[#E8E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#F2EADE] text-[#131313] flex items-center justify-center shrink-0">
                  <IconCompare className="w-5 h-5 text-[#F34431]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#131313]">Bandingkan Dimensi PxL Pakaian Wishlist</h4>
                  <p className="text-[11px] text-[#575752] mt-0.5">
                    Lihat perbandingan presisi ukuran fisik (Panjang × Lebar cm), skor kondisi /10, dan harga berdampingan.
                  </p>
                </div>
              </div>
              <Link
                href={`/compare?ids=${favorites.slice(0, 3).map((f) => f.product.id).join(",")}`}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#131313] hover:bg-[#262626] text-white text-xs font-bold transition shrink-0 active:scale-98"
              >
                <IconCompare className="w-3.5 h-3.5" />
                <span>Bandingkan Pakaian Wishlist ({Math.min(3, favorites.length)}) →</span>
              </Link>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {favorites.map((fav) => (
            <div key={fav.id} className="relative group">
              <ProductCard
                id={fav.product.id}
                title={fav.product.title}
                price={fav.product.price}
                size={fav.product.size}
                chestWidthCm={fav.product.chestWidthCm}
                lengthCm={fav.product.lengthCm}
                condition={fav.product.condition}
                status={fav.product.status}
                city={fav.product.city}
                isSpotlight={fav.product.isSpotlight}
                originCountry={fav.product.originCountry}
                category={fav.product.category}
                images={fav.product.images}
                isFavorited={true}
                onToggleFavorite={(id, newState) => {
                  if (!newState) {
                    setFavorites((prev) => prev.filter((f) => f.product.id !== id));
                  }
                }}
              />
            </div>
          ))}
          </div>
        </div>
      )}
    </main>
  );
}
