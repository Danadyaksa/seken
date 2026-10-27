"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  IconSliders, 
  IconX
} from "@/components/Icons";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface OriginCountry {
  code: string;
  name: string;
  flagEmoji: string;
}

interface FilterBarProps {
  categories: Category[];
  countries?: OriginCountry[];
  totalResults: number;
}

const CONDITION_OPTIONS = [
  { value: "BRAND_NEW", label: "10/10 Baru (BNWT)" },
  { value: "LIKE_NEW", label: "9/10 Seperti Baru" },
  { value: "VERY_GOOD", label: "8/10 Sangat Bagus" },
  { value: "GOOD", label: "7/10 Good Vintage" },
  { value: "FLAWED_VINTAGE", label: "5-6/10 Ada Minus" },
];

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];

export default function FilterBar({ categories, totalResults }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);

  // Read current query params
  const q = searchParams.get("q") || "";
  const country = searchParams.get("country") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "newest";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const condition = searchParams.get("condition") || "";
  const size = searchParams.get("size") || "";
  const city = searchParams.get("city") || "";
  const method = searchParams.get("method") || "";

  // Temporary local state for panel form
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);
  const [localCondition, setLocalCondition] = useState(condition);
  const [localSize, setLocalSize] = useState(size);
  const [localCity, setLocalCity] = useState(city);
  const [localMethod, setLocalMethod] = useState(method);

  // Helper to build URL with updated params
  const buildUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === undefined) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    return `/?${params.toString()}`;
  };

  const handleApplyExtendedFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const url = buildUrl({
      minPrice: localMinPrice || null,
      maxPrice: localMaxPrice || null,
      condition: localCondition || null,
      size: localSize || null,
      city: localCity || null,
      method: localMethod || null,
    });
    router.push(url);
    setIsOpen(false);
  };

  const handleResetAll = () => {
    setLocalMinPrice("");
    setLocalMaxPrice("");
    setLocalCondition("");
    setLocalSize("");
    setLocalCity("");
    setLocalMethod("");
    router.push("/");
    setIsOpen(false);
  };

  // Check if any filter is active
  const hasActiveFilters = Boolean(
    q || country || category || minPrice || maxPrice || condition || size || city || method
  );

  return (
    <div className="space-y-4 mb-6">
      {/* Category Horizontal Filter Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-[#E8E2D8] pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <Link
            href={buildUrl({ category: null })}
            className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg transition-all duration-150 border active:scale-[0.98] ${
              !category
                ? "bg-[#131313] text-[#FAF8F5] border-[#131313] shadow-xs"
                : "text-[#575752] hover:text-[#131313] hover:bg-[#F2EADE]/50 border-transparent"
            }`}
          >
            Semua Kategori
          </Link>
          {categories.map((cat) => {
            const isActive = category === cat.slug;
            return (
              <Link
                key={cat.id}
                href={buildUrl({ category: isActive ? null : cat.slug })}
                className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg transition-all duration-150 border active:scale-[0.98] ${
                  isActive
                    ? "bg-[#131313] text-[#FAF8F5] border-[#131313] shadow-xs"
                    : "text-[#575752] hover:text-[#131313] hover:bg-[#F2EADE]/50 border-transparent"
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>

        {/* Total Count Badge */}
        <div className="shrink-0 hidden md:block text-xs font-semibold text-[#575752]">
          {totalResults} pakaian
        </div>
      </div>

      {/* Primary Toolbar: Summary, Filter Button & Sorting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
              isOpen || minPrice || maxPrice || condition || size || city || method
                ? "bg-[#131313] text-white border-[#131313]"
                : "bg-white text-[#131313] border-[#E8E2D8] hover:bg-[#FAF8F5]"
            }`}
          >
            <IconSliders className="w-3.5 h-3.5" />
            <span>Filter Lanjutan</span>
            {(minPrice || maxPrice || condition || size || city || method) && (
              <span className="w-2 h-2 rounded-full bg-[#F34431]" />
            )}
          </button>

          <span className="text-xs text-[#575752]">
            Menampilkan <strong className="text-[#131313]">{totalResults}</strong> pakaian
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetAll}
              className="text-xs font-bold text-[#F34431] hover:underline cursor-pointer ml-1"
            >
              Reset Semua
            </button>
          )}
        </div>

        {/* Sorting Controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-[11px] font-semibold text-[#73736C]">Urutan:</span>
          <div className="flex items-center p-0.5 bg-[#F2EADE]/60 rounded-lg border border-[#E8E2D8] text-xs">
            <Link
              href={buildUrl({ sort: "newest" })}
              className={`px-2.5 py-1 rounded-md transition ${
                sort === "newest" || !sort
                  ? "font-bold text-[#131313] bg-white shadow-xs"
                  : "text-[#575752] hover:text-[#131313]"
              }`}
            >
              Terbaru
            </Link>
            <Link
              href={buildUrl({ sort: "popular" })}
              className={`px-2.5 py-1 rounded-md transition ${
                sort === "popular"
                  ? "font-bold text-[#131313] bg-white shadow-xs"
                  : "text-[#575752] hover:text-[#131313]"
              }`}
            >
              Terpopuler
            </Link>
            <Link
              href={buildUrl({ sort: "price_asc" })}
              className={`px-2.5 py-1 rounded-md transition ${
                sort === "price_asc"
                  ? "font-bold text-[#131313] bg-white shadow-xs"
                  : "text-[#575752] hover:text-[#131313]"
              }`}
            >
              Harga Termurah
            </Link>
            <Link
              href={buildUrl({ sort: "price_desc" })}
              className={`px-2.5 py-1 rounded-md transition ${
                sort === "price_desc"
                  ? "font-bold text-[#131313] bg-white shadow-xs"
                  : "text-[#575752] hover:text-[#131313]"
              }`}
            >
              Harga Tertinggi
            </Link>
          </div>
        </div>
      </div>

      {/* Active Filter Chips (Removable individually) */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {q && (
            <Link
              href={buildUrl({ q: null })}
              className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#F2EADE] text-[#131313] px-2.5 py-1 rounded-full border border-[#E8E2D8] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition"
              title="Hapus filter pencarian"
            >
              <span>Kata kunci: &ldquo;{q}&rdquo;</span>
              <IconX className="w-3 h-3" />
            </Link>
          )}

          {country && (
            <Link
              href={buildUrl({ country: null })}
              className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#F2EADE] text-[#131313] px-2.5 py-1 rounded-full border border-[#E8E2D8] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition"
            >
              <span>Baleran: {country}</span>
              <IconX className="w-3 h-3" />
            </Link>
          )}

          {category && (
            <Link
              href={buildUrl({ category: null })}
              className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#F2EADE] text-[#131313] px-2.5 py-1 rounded-full border border-[#E8E2D8] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition"
            >
              <span>Kategori: {categories.find((c) => c.slug === category)?.name || category}</span>
              <IconX className="w-3 h-3" />
            </Link>
          )}

          {(minPrice || maxPrice) && (
            <Link
              href={buildUrl({ minPrice: null, maxPrice: null })}
              className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#F2EADE] text-[#131313] px-2.5 py-1 rounded-full border border-[#E8E2D8] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition"
            >
              <span>
                Harga: {minPrice ? `Rp ${Number(minPrice).toLocaleString("id-ID")}` : "0"} -{" "}
                {maxPrice ? `Rp ${Number(maxPrice).toLocaleString("id-ID")}` : "Maks"}
              </span>
              <IconX className="w-3 h-3" />
            </Link>
          )}

          {condition && (
            <Link
              href={buildUrl({ condition: null })}
              className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#F2EADE] text-[#131313] px-2.5 py-1 rounded-full border border-[#E8E2D8] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition"
            >
              <span>Kondisi: {CONDITION_OPTIONS.find((c) => c.value === condition)?.label || condition}</span>
              <IconX className="w-3 h-3" />
            </Link>
          )}

          {size && (
            <Link
              href={buildUrl({ size: null })}
              className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#F2EADE] text-[#131313] px-2.5 py-1 rounded-full border border-[#E8E2D8] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition"
            >
              <span>Ukuran: {size}</span>
              <IconX className="w-3 h-3" />
            </Link>
          )}

          {city && (
            <Link
              href={buildUrl({ city: null })}
              className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#F2EADE] text-[#131313] px-2.5 py-1 rounded-full border border-[#E8E2D8] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition"
            >
              <span>Lokasi Penjual: {city}</span>
              <IconX className="w-3 h-3" />
            </Link>
          )}

          {method && (
            <Link
              href={buildUrl({ method: null })}
              className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#F2EADE] text-[#131313] px-2.5 py-1 rounded-full border border-[#E8E2D8] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition"
            >
              <span>Metode: {method === "cod" ? "Bisa COD" : "Pengiriman Ekspedisi"}</span>
              <IconX className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      {/* Expandable Extended Filter Panel */}
      {isOpen && (
        <form
          onSubmit={handleApplyExtendedFilters}
          className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-sm space-y-4 animate-in fade-in-50 duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#131313]">
              Pengaturan Filter Spesifik
            </h4>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#73736C] hover:text-[#131313] p-1 cursor-pointer text-xs"
            >
              ✕ Tutup
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* 1. Price Range */}
            <div>
              <label className="block font-bold text-[#131313] mb-1.5">Rentang Harga (Rp)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={localMinPrice}
                  onChange={(e) => setLocalMinPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] focus:bg-white text-xs text-[#131313]"
                />
                <span className="text-[#73736C]">-</span>
                <input
                  type="number"
                  placeholder="Maks"
                  value={localMaxPrice}
                  onChange={(e) => setLocalMaxPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] focus:bg-white text-xs text-[#131313]"
                />
              </div>
            </div>

            {/* 2. Condition */}
            <div>
              <label className="block font-bold text-[#131313] mb-1.5">Kondisi Pakaian</label>
              <select
                value={localCondition}
                onChange={(e) => setLocalCondition(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] text-xs text-[#131313]"
              >
                <option value="">Semua Kondisi</option>
                {CONDITION_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Size */}
            <div>
              <label className="block font-bold text-[#131313] mb-1.5">Ukuran Pakaian</label>
              <select
                value={localSize}
                onChange={(e) => setLocalSize(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] text-xs text-[#131313]"
              >
                <option value="">Semua Ukuran</option>
                {SIZE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    Size {s}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Seller City (Distinct from Origin Country) */}
            <div>
              <label className="block font-bold text-[#131313] mb-1.5">
                <span>Lokasi Penjual</span>
                <span className="text-[10px] font-normal text-[#73736C] ml-1">(Beda dengan asal baleran)</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Bandung, Jakarta"
                value={localCity}
                onChange={(e) => setLocalCity(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] focus:bg-white text-xs text-[#131313]"
              />
            </div>
          </div>

          {/* Transaction Method Option */}
          <div className="pt-2 border-t border-[#E8E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <span className="font-bold text-[#131313]">Metode Transaksi:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="method"
                  checked={localMethod === ""}
                  onChange={() => setLocalMethod("")}
                  className="accent-[#131313]"
                />
                <span>Semua</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="method"
                  checked={localMethod === "cod"}
                  onChange={() => setLocalMethod("cod")}
                  className="accent-[#131313]"
                />
                <span>Bisa COD Saja</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="method"
                  checked={localMethod === "delivery"}
                  onChange={() => setLocalMethod("delivery")}
                  className="accent-[#131313]"
                />
                <span>Pengiriman Ekspedisi</span>
              </label>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleResetAll}
                className="px-3.5 py-1.5 text-xs text-[#73736C] hover:text-[#131313] font-semibold cursor-pointer"
              >
                Reset
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 bg-[#131313] hover:bg-[#282828] text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
