"use client";

import { useState } from "react";
import Link from "next/link";
import { IconArrowRight, IconTag } from "@/components/Icons";

interface CompareProduct {
  id: string;
  title: string;
  price: number;
  size: string;
  chestWidthCm?: number | null;
  lengthCm?: number | null;
  condition: string;
  defectNotes?: string | null;
  status: string;
  city?: string | null;
  canCod: boolean;
  codArea?: string | null;
  originCountry: {
    code: string;
    name: string;
    flagEmoji: string;
  };
  category: {
    name: string;
  };
  seller: {
    id: string;
    name: string;
    profile?: {
      username: string;
      city?: string | null;
    } | null;
  };
  images: {
    imageUrl: string;
    isPrimary: boolean;
  }[];
}

interface CompareClientProps {
  initialProducts: CompareProduct[];
  allAvailableProducts: { id: string; title: string; price: number; images: { imageUrl: string }[] }[];
}

export default function CompareClient({ initialProducts, allAvailableProducts }: CompareClientProps) {
  const [products, setProducts] = useState<CompareProduct[]>(initialProducts);
  const [selectedAddId, setSelectedAddId] = useState("");

  const conditionLabels: Record<string, { label: string; style: string }> = {
    BRAND_NEW: { label: "10/10 Baru (BNWT)", style: "bg-emerald-50 text-emerald-800 border-emerald-200" },
    LIKE_NEW: { label: "9/10 Like New", style: "bg-blue-50 text-blue-800 border-blue-200" },
    VERY_GOOD: { label: "8/10 Very Good", style: "bg-teal-50 text-teal-800 border-teal-200" },
    GOOD: { label: "7/10 Good Vintage", style: "bg-amber-50 text-amber-800 border-amber-200" },
    FLAWED_VINTAGE: { label: "5-6/10 Minus Terdata", style: "bg-rose-50 text-rose-800 border-rose-200" },
  };

  const formatPrice = (val: number) => {
    if (val === 0) return "GRATIS";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleRemove = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddProduct = async (productId: string) => {
    if (!productId || products.some((p) => p.id === productId) || products.length >= 3) return;

    try {
      const res = await fetch(`/api/products/${productId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.product) {
          setProducts((prev) => [...prev, data.product]);
          setSelectedAddId("");
        }
      }
    } catch (err) {
      console.error("Add to compare error:", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Controls: Add product selector */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E2D8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase text-[#73736C] tracking-wider block">
            SLOT PERBANDINGAN ({products.length}/3 PAKAIAN)
          </span>
          <p className="text-xs text-[#575752] mt-0.5">
            Bandingkan ukuran fisik riil (PxL cm), harga, dan catatan minus pakaian vintage secara presisi.
          </p>
        </div>

        {products.length < 3 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedAddId}
              onChange={(e) => {
                setSelectedAddId(e.target.value);
                if (e.target.value) handleAddProduct(e.target.value);
              }}
              className="text-xs px-3 py-2 rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] text-[#131313] focus:outline-none focus:border-[#131313] flex-1 sm:w-72 cursor-pointer font-medium"
            >
              <option value="">+ Tambah dari Wishlist untuk dibanding...</option>
              {allAvailableProducts
                .filter((p) => !products.some((curr) => curr.id === p.id))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {formatPrice(p.price)}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#E8E2D8] px-4">
          <div className="w-14 h-14 bg-[#F2EADE] rounded-2xl flex items-center justify-center mx-auto text-[#7A7A73] mb-4">
            <IconTag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#131313] mb-1">Pilih Pakaian untuk Dibandingkan</h3>
          <p className="text-xs sm:text-sm text-[#575752] max-w-md mx-auto mb-6">
            Pilih minimal 2 pakaian vintage dari katalog untuk menganalisis perbedaan ukuran riil, kondisi, dan harga.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#131313] text-[#FAF8F5] text-xs font-bold hover:bg-[#F34431] transition shadow-xs"
          >
            <span>Buka Katalog Utama</span>
            <IconArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* Side by Side Comparison Grid / Matrix */
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[700px] bg-white rounded-2xl border border-[#E8E2D8] shadow-xs overflow-hidden">
            {/* Header: Photo, Title & Price */}
            <div className={`grid grid-cols-${products.length + 1} divide-x divide-[#E8E2D8] border-b border-[#E8E2D8]`}>
              <div className="p-4 bg-[#FAF8F5] font-mono text-xs font-bold text-[#73736C] uppercase flex items-end">
                Pakaian Vintage
              </div>
              {products.map((p) => {
                const img = p.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800";
                return (
                  <div key={p.id} className="p-4 flex flex-col justify-between relative group">
                    <button
                      type="button"
                      onClick={() => handleRemove(p.id)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#FAF8F5] text-[#73736C] hover:text-rose-600 hover:bg-rose-50 border border-[#E8E2D8] flex items-center justify-center text-xs transition cursor-pointer"
                      title="Hapus dari tabel"
                    >
                      ✕
                    </button>

                    <div>
                      <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-[#F2EADE] mb-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt={p.title} className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 left-2 bg-[#131313]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          {p.originCountry.code} · {p.originCountry.name}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono uppercase text-[#73736C]">{p.category.name}</span>
                      <h4 className="font-bold text-xs sm:text-sm text-[#131313] line-clamp-2 mt-0.5 mb-2">
                        {p.title}
                      </h4>
                    </div>

                    <div className="pt-3 border-t border-[#E8E2D8]/70 flex items-center justify-between">
                      <span className="text-sm font-black text-[#131313]">{formatPrice(p.price)}</span>
                      <Link
                        href={`/products/${p.id}`}
                        className="text-[11px] font-bold text-[#FAF8F5] bg-[#131313] hover:bg-[#F34431] px-2.5 py-1.5 rounded transition shadow-xs"
                      >
                        Lihat & Tawar →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Row: Ukuran Riil PxL (The Core Unique Feature) */}
            <div className={`grid grid-cols-${products.length + 1} divide-x divide-[#E8E2D8] border-b border-[#E8E2D8] bg-[#FAF8F5]/40 text-xs`}>
              <div className="p-4 font-mono font-bold text-[#131313] flex items-center gap-1.5">
                <span>Ukuran Riil (PxL cm)</span>
              </div>
              {products.map((p) => (
                <div key={p.id} className="p-4 font-mono font-semibold text-[#131313]">
                  {p.chestWidthCm && p.lengthCm ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F2EADE] border border-[#E8E2D8]">
                      <span>Panjang: {p.lengthCm} cm</span>
                      <span className="text-[#A8A8A0]">×</span>
                      <span>Lebar: {p.chestWidthCm} cm</span>
                    </div>
                  ) : (
                    <span className="text-[#73736C] italic">Hanya Tag Size {p.size}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Row: Tag Size */}
            <div className={`grid grid-cols-${products.length + 1} divide-x divide-[#E8E2D8] border-b border-[#E8E2D8] text-xs`}>
              <div className="p-4 font-semibold text-[#575752]">Tag Size Label</div>
              {products.map((p) => (
                <div key={p.id} className="p-4 font-bold text-[#131313]">
                  Size {p.size}
                </div>
              ))}
            </div>

            {/* Row: Kondisi Pemakaian /10 */}
            <div className={`grid grid-cols-${products.length + 1} divide-x divide-[#E8E2D8] border-b border-[#E8E2D8] text-xs`}>
              <div className="p-4 font-semibold text-[#575752]">Skor Kondisi Fisik</div>
              {products.map((p) => {
                const cond = conditionLabels[p.condition] || { label: p.condition, style: "" };
                return (
                  <div key={p.id} className="p-4">
                    <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold border ${cond.style}`}>
                      {cond.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Row: Catatan Minus / Cacat Fisik */}
            <div className={`grid grid-cols-${products.length + 1} divide-x divide-[#E8E2D8] border-b border-[#E8E2D8] bg-[#FAF8F5]/30 text-xs`}>
              <div className="p-4 font-semibold text-[#575752]">Catatan Minus / Cacat</div>
              {products.map((p) => (
                <div key={p.id} className="p-4 text-xs leading-relaxed text-[#3D3D3A]">
                  {p.defectNotes ? (
                    <span className="text-amber-900 bg-amber-50 px-2 py-1 rounded border border-amber-200 block">
                      ⚠️ {p.defectNotes}
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-medium">✓ Mulus tanpa minus terdeteksi</span>
                  )}
                </div>
              ))}
            </div>

            {/* Row: Domisili Seller & COD */}
            <div className={`grid grid-cols-${products.length + 1} divide-x divide-[#E8E2D8] border-b border-[#E8E2D8] text-xs`}>
              <div className="p-4 font-semibold text-[#575752]">Metode COD & Lokasi</div>
              {products.map((p) => (
                <div key={p.id} className="p-4">
                  <div className="font-semibold text-[#131313]">{p.city || "Kota belum disetel"}</div>
                  {p.canCod ? (
                    <span className="text-[11px] text-emerald-700 block mt-1">
                      ✓ Bisa COD: {p.codArea || "Sesuai kesepakatan"}
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#73736C] block mt-1">Hanya Ekspedisi Pengiriman</span>
                  )}
                </div>
              ))}
            </div>

            {/* Row: Penjual & Reputasi */}
            <div className={`grid grid-cols-${products.length + 1} divide-x divide-[#E8E2D8] text-xs bg-[#FAF8F5]/20`}>
              <div className="p-4 font-semibold text-[#575752]">Penjual Thrift</div>
              {products.map((p) => (
                <div key={p.id} className="p-4">
                  <Link
                    href={`/seller/${p.seller.profile?.username || p.seller.id}`}
                    className="font-bold text-[#131313] hover:text-[#F34431] transition underline"
                  >
                    @{p.seller.profile?.username || p.seller.name}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
