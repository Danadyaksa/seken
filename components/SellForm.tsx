"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  IconPlus, 
  IconX, 
  IconAlert, 
  IconArrowRight, 
  IconRuler,
  IconSearch,
  IconCheck,
  IconEye
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

interface InitialProductData {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  originCountryCode: string;
  price: number;
  size: string;
  chestWidthCm?: number | null;
  lengthCm?: number | null;
  condition: string;
  defectNotes?: string | null;
  city?: string | null;
  canCod: boolean;
  codArea?: string | null;
  shippingNotes?: string | null;
  images: { imageUrl: string; isPrimary: boolean }[];
}

interface SellFormProps {
  categories: Category[];
  countries: OriginCountry[];
  userCity?: string | null;
  mode?: "create" | "edit";
  initialProduct?: InitialProductData;
}

const CONDITION_OPTIONS = [
  {
    value: "BRAND_NEW",
    score: "10/10",
    label: "Baru / Brand New with Tag (BNWT)",
    desc: "Segel toko / label utuh, belum pernah dipakai sama sekali.",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  {
    value: "LIKE_NEW",
    score: "9/10",
    label: "Seperti Baru / Like New",
    desc: "Sangat mulus tanpa cacat, tanpa noda, warna pekat 99%.",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
  },
  {
    value: "VERY_GOOD",
    score: "8/10",
    label: "Sangat Bagus / Very Good",
    desc: "Terawat dengan baik, pemakaian wajar sangat minim jejak.",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-300",
  },
  {
    value: "GOOD",
    score: "7/10",
    label: "Cukup Bagus / Good Vintage",
    desc: "Faded alami khas pakaian vintage baleran, kain tetap kokoh utuh.",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
  },
  {
    value: "FLAWED_VINTAGE",
    score: "5-6/10",
    label: "Ada Minus / Flawed Vintage",
    desc: "Ada noda, lubang jarum (pinhole), atau sablon retak khas usia.",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
  },
];

export default function SellForm({
  categories,
  countries,
  userCity,
  mode = "create",
  initialProduct,
}: SellFormProps) {
  const router = useRouter();

  const isEdit = mode === "edit" && !!initialProduct;

  const [imageUrls, setImageUrls] = useState<string[]>(
    isEdit ? initialProduct.images.map((img) => img.imageUrl) : []
  );
  const [coverIndex, setCoverIndex] = useState<number>(
    isEdit ? Math.max(0, initialProduct.images.findIndex((img) => img.isPrimary)) : 0
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isFree, setIsFree] = useState(isEdit ? initialProduct.price === 0 : false);
  const [hasMeetup, setHasMeetup] = useState(isEdit ? initialProduct.canCod : false);
  const [hasDelivery, setHasDelivery] = useState(isEdit ? !!initialProduct.shippingNotes : true);

  const [formData, setFormData] = useState({
    title: isEdit ? initialProduct.title : "",
    description: isEdit ? initialProduct.description : "",
    categoryId: isEdit ? initialProduct.categoryId : categories[0]?.id || "",
    originCountryCode: isEdit ? initialProduct.originCountryCode : "JP",
    price: isEdit ? (initialProduct.price === 0 ? "0" : String(initialProduct.price)) : "",
    size: isEdit ? initialProduct.size : "L",
    chestWidthCm: isEdit && initialProduct.chestWidthCm ? String(initialProduct.chestWidthCm) : "",
    lengthCm: isEdit && initialProduct.lengthCm ? String(initialProduct.lengthCm) : "",
    condition: isEdit ? initialProduct.condition : "GOOD",
    defectNotes: isEdit ? initialProduct.defectNotes || "" : "",
    city: isEdit ? initialProduct.city || userCity || "Bandung" : userCity || "Bandung",
    codArea: isEdit ? initialProduct.codArea || "" : "",
    shippingNotes: isEdit
      ? initialProduct.shippingNotes || "Pengiriman reguler via JNE / J&T / SiCepat."
      : "Pengiriman reguler via JNE / J&T / SiCepat ke seluruh Indonesia.",
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (imageUrls.length + files.length > 8) {
      setUploadError("Maksimal 8 foto per pakaian");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const data = new FormData();
        data.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: data,
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Gagal mengunggah foto");
        }

        setImageUrls((prev) => [...prev, json.url]);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setUploadError(err.message);
      } else {
        setUploadError("Gagal mengunggah foto");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (coverIndex === indexToRemove) {
      setCoverIndex(0);
    } else if (coverIndex > indexToRemove) {
      setCoverIndex((prev) => prev - 1);
    }
  };

  const handleFreeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsFree(checked);
    if (checked) {
      setFormData((prev) => ({ ...prev, price: "0" }));
    } else {
      setFormData((prev) => ({ ...prev, price: "" }));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    setFormData({ ...formData, [target.name]: target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (imageUrls.length === 0) {
      setError("Wajib mengunggah minimal 1 foto pakaian thrift.");
      return;
    }

    if (!hasMeetup && !hasDelivery) {
      setError("Pilih minimal 1 metode transaksi pada Deal Methods (Meet-up atau Mailing & Delivery).");
      return;
    }

    setIsSubmitting(true);

    try {
      const finalPrice = isFree ? 0 : Number(formData.price);
      if (!isFree && (isNaN(finalPrice) || finalPrice <= 0)) {
        throw new Error("Harga jual harus diisi angka yang valid atau centang opsi Gratis.");
      }

      const payload = {
        title: formData.title,
        description: formData.description || "",
        categoryId: formData.categoryId,
        originCountryCode: formData.originCountryCode,
        price: finalPrice,
        size: formData.size,
        chestWidthCm: formData.chestWidthCm ? Number(formData.chestWidthCm) : undefined,
        lengthCm: formData.lengthCm ? Number(formData.lengthCm) : undefined,
        condition: formData.condition,
        defectNotes: formData.defectNotes || null,
        city: formData.city,
        canCod: hasMeetup,
        codArea: hasMeetup ? formData.codArea : null,
        canDelivery: hasDelivery,
        shippingNotes: hasDelivery ? formData.shippingNotes : null,
        imageUrls,
        primaryImageIndex: coverIndex,
      };

      const endpoint = isEdit ? `/api/products/${initialProduct.id}` : "/api/products";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(
          json.error || (isEdit ? "Gagal memperbarui listing pakaian" : "Gagal menerbitkan listing pakaian")
        );
      }

      router.push(isEdit ? `/products/${initialProduct.id}` : `/products/${json.productId}`);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan sistem saat menyimpan iklan");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <IconAlert className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Multi-photo Upload Box with Cover Selector */}
      <div className="bg-white p-5 rounded-xl border border-[#E8E2D8] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#131313] flex items-center gap-1.5">
              <span>Foto Pakaian Thrift</span>
              <span className="text-[#F34431] font-bold text-sm">*</span>
            </h3>
            <p className="text-xs text-[#7E7E77] mt-0.5">
              Unggah 1 - 8 foto. Klik tombol <span className="font-semibold text-[#131313]">&ldquo;Jadikan Cover&rdquo;</span> untuk memilih foto sampul utama yang tampil di katalog.
            </p>
          </div>
          <span className="text-xs font-bold text-[#7E7E77] shrink-0">
            {imageUrls.length}/8 foto
          </span>
        </div>

        {uploadError && (
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-1.5">
            <IconAlert className="w-3.5 h-3.5" />
            <span>{uploadError}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {imageUrls.map((url, idx) => {
            const isCover = idx === coverIndex;
            return (
              <div 
                key={idx} 
                className={`relative aspect-square rounded-lg overflow-hidden border transition-all ${
                  isCover 
                    ? "border-2 border-[#131313] shadow-md ring-2 ring-[#F34431]/20" 
                    : "border-[#E8E2D8] bg-[#F2EADE]"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-md bg-[#131313]/70 text-white hover:bg-[#F34431] transition cursor-pointer z-10"
                  title="Hapus foto ini"
                >
                  <IconX className="w-3.5 h-3.5" />
                </button>

                {/* Cover badge / Set as cover button */}
                {isCover ? (
                  <div className="absolute bottom-1.5 inset-x-1.5 bg-[#131313] text-white text-[10px] font-bold py-1 px-1.5 rounded flex items-center justify-center gap-1 shadow">
                    <span className="text-[#F34431]">★</span>
                    <span>Cover Utama</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCoverIndex(idx)}
                    className="absolute bottom-1.5 inset-x-1.5 bg-white/90 hover:bg-[#131313] hover:text-white text-[#131313] text-[10px] font-semibold py-1 px-1.5 rounded transition shadow-sm cursor-pointer text-center"
                  >
                    Jadikan Cover
                  </button>
                )}
              </div>
            );
          })}

          {imageUrls.length < 8 && (
            <label className="aspect-square rounded-lg border border-dashed border-[#D1D1C7] hover:border-[#131313] bg-[#FAF8F5] hover:bg-[#F2EADE] cursor-pointer flex flex-col items-center justify-center p-3 text-center transition group">
              <IconPlus className="w-5 h-5 text-[#7E7E77] group-hover:text-[#131313] mb-1 transition" />
              <span className="text-[11px] font-bold text-[#4A4A48] group-hover:text-[#131313]">
                {isUploading ? "Mengunggah..." : "Tambah Foto"}
              </span>
              <span className="text-[9px] text-[#A8A8A0] mt-0.5">JPG, PNG, WEBP</span>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={isUploading}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* 2. Garment Details & Origin */}
      <div className="bg-white p-5 rounded-xl border border-[#E8E2D8] space-y-4">
        <h3 className="font-bold text-sm text-[#131313]">Identitas & Informasi Pakaian</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#4A4A48] mb-1.5">
              <span>Asal Baleran Impor</span>
              <span className="text-[#F34431] font-bold ml-1">*</span>
            </label>
            <select
              name="originCountryCode"
              value={formData.originCountryCode}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-[#E8E2D8] focus:border-[#131313] focus:outline-none text-xs bg-white text-[#131313]"
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flagEmoji} {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4A4A48] mb-1.5">
              <span>Kategori Pakaian ({categories.length} Kategori Tersedia)</span>
              <span className="text-[#F34431] font-bold ml-1">*</span>
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-[#E8E2D8] focus:border-[#131313] focus:outline-none text-xs bg-white text-[#131313]"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#4A4A48] mb-1.5">
            <span>Judul Listing Pakaian (Merek, Model, Warna, Era)</span>
            <span className="text-[#F34431] font-bold ml-1">*</span>
          </label>
          <input
            type="text"
            required
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Contoh: Vintage Carhartt Detroit Jacket J97 Moss Green Blanket Lined"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E2D8] focus:border-[#131313] focus:outline-none text-xs text-[#131313] transition"
          />
        </div>

        {/* Pricing with Free Option */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[#4A4A48] flex items-center">
              <span>Harga Jual (IDR)</span>
              {!isFree && <span className="text-[#F34431] font-bold ml-1">*</span>}
            </label>
            
            {/* Free checkbox toggle */}
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#131313] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isFree}
                onChange={handleFreeToggle}
                className="w-4 h-4 rounded text-[#131313] focus:ring-0 cursor-pointer accent-[#131313]"
              />
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                Berikan Gratis (Rp 0 / Free)
              </span>
            </label>
          </div>

          {isFree ? (
            <div className="px-3.5 py-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <IconCheck className="w-4 h-4 text-emerald-600" />
                <span>Barang ini akan ditandai sebagai GRATIS / FREE di katalog</span>
              </div>
              <span className="text-xs font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded">
                Rp 0
              </span>
            </div>
          ) : (
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7E7E77]">
                Rp
              </span>
              <input
                type="number"
                required={!isFree}
                min="1000"
                step="1000"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="Contoh: 350000"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E8E2D8] focus:border-[#131313] focus:outline-none text-xs text-[#131313] font-bold tabular-nums transition"
              />
            </div>
          )}
        </div>
      </div>

      {/* 3. Real Sizing & 1-10 Condition Indicator */}
      <div className="bg-white p-5 rounded-xl border border-[#E8E2D8] space-y-4">
        <div className="flex items-center gap-2">
          <IconRuler className="w-4 h-4 text-[#131313]" />
          <h3 className="font-bold text-sm text-[#131313]">Inspeksi Ukuran & Kondisi Pemakaian</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#4A4A48] mb-1.5">
              <span>Tag Ukuran Kerah</span>
              <span className="text-[#F34431] font-bold ml-1">*</span>
            </label>
            <input
              type="text"
              required
              name="size"
              value={formData.size}
              onChange={handleChange}
              placeholder="Contoh: L, M, XL, W32 L34"
              className="w-full px-3 py-2 rounded-lg border border-[#E8E2D8] focus:border-[#131313] focus:outline-none text-xs text-[#131313]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4A4A48] mb-1.5">
              <span>Panjang Baju (cm)</span>
              <span className="text-[10px] text-[#A8A8A0] font-normal ml-1">(Opsional)</span>
            </label>
            <input
              type="number"
              min="10"
              max="200"
              name="lengthCm"
              value={formData.lengthCm}
              onChange={handleChange}
              placeholder="Contoh: 72"
              className="w-full px-3 py-2 rounded-lg border border-[#E8E2D8] focus:border-[#131313] focus:outline-none text-xs text-[#131313]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4A4A48] mb-1.5">
              <span>Lebar Dada (cm)</span>
              <span className="text-[10px] text-[#A8A8A0] font-normal ml-1">(Opsional)</span>
            </label>
            <input
              type="number"
              min="10"
              max="150"
              name="chestWidthCm"
              value={formData.chestWidthCm}
              onChange={handleChange}
              placeholder="Contoh: 56"
              className="w-full px-3 py-2 rounded-lg border border-[#E8E2D8] focus:border-[#131313] focus:outline-none text-xs text-[#131313]"
            />
          </div>
        </div>

        {/* 1-10 Scaled Condition Selector */}
        <div>
          <label className="block text-xs font-semibold text-[#4A4A48] mb-1.5">
            <span>Indikator Kondisi Pemakaian (Skala 1 - 10)</span>
            <span className="text-[#F34431] font-bold ml-1">*</span>
          </label>
          
          <div className="space-y-2">
            {CONDITION_OPTIONS.map((opt) => {
              const isSelected = formData.condition === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    isSelected
                      ? "border-[#131313] bg-[#FAF8F5] shadow-xs"
                      : "border-[#E8E2D8] hover:bg-[#FAF8F5]/60 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="condition"
                    value={opt.value}
                    checked={isSelected}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 accent-[#131313]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${opt.badgeClass}`}>
                        {opt.score}
                      </span>
                      <span className="text-xs font-bold text-[#131313]">{opt.label}</span>
                    </div>
                    <p className="text-[11px] text-[#7E7E77] mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#4A4A48] mb-1.5">
            <span>Rincian Minus & Cacat Kain</span>
            <span className="text-[10px] text-[#A8A8A0] font-normal ml-1">(Bila ada noda/pinhole/sobek)</span>
          </label>
          <textarea
            rows={2}
            name="defectNotes"
            value={formData.defectNotes}
            onChange={handleChange}
            placeholder="Contoh: Ada 1 pinhole kecil di kerah belakang, sablon retak alami khas vintage baleran..."
            className="w-full px-3.5 py-2 rounded-lg border border-[#E8E2D8] focus:border-[#131313] focus:outline-none text-xs text-[#131313] leading-relaxed transition"
          />
        </div>

        {/* Full description - now Optional */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[#4A4A48]">
              Deskripsi Lengkap
            </label>
            <span className="text-[10px] text-[#7E7E77]">Opsional</span>
          </div>
          <textarea
            rows={3}
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Ceritakan detail kain, single stitch/double stitch, tag leher, keunikan, dan riwayat pakaian (opsional)..."
            className="w-full px-3.5 py-2 rounded-lg border border-[#E8E2D8] focus:border-[#131313] focus:outline-none text-xs text-[#131313] leading-relaxed transition"
          />
        </div>
      </div>

      {/* 4. Deal Methods (Carousell Style - Matches User Screenshot 1) */}
      <div className="bg-white p-5 rounded-xl border border-[#E8E2D8] space-y-4">
        <div>
          <h3 className="font-bold text-base text-[#131313] tracking-tight">Deal methods</h3>
          <p className="text-xs text-[#7E7E77] mt-0.5">
            Pilih metode transaksi yang kamu dukung untuk memudahkan pembeli menemukan pakaianmu.
          </p>
        </div>

        <div className="space-y-4 pt-1">
          {/* Option 1: Meet-up */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasMeetup}
                onChange={(e) => setHasMeetup(e.target.checked)}
                className="w-4 h-4 rounded text-[#131313] accent-[#059669] focus:ring-0 cursor-pointer"
              />
              <span className="text-sm font-semibold text-[#131313]">Meet-up (Ketemuan / COD)</span>
            </label>

            {hasMeetup && (
              <div className="pl-6.5 animate-in fade-in-50 duration-200">
                <div className="relative">
                  <input
                    type="text"
                    name="codArea"
                    value={formData.codArea}
                    onChange={handleChange}
                    placeholder="Add location (misal: Simpang Dago, Stasiun Manggarai, Grand Indonesia)"
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D8] focus:border-[#131313] focus:bg-white text-xs text-[#131313] pl-3.5 pr-10 py-2.5 rounded-lg focus:outline-none transition"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7E7E77]">
                    <IconSearch className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-[#F2EADE]" />

          {/* Option 2: Mailing & Delivery */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasDelivery}
                onChange={(e) => setHasDelivery(e.target.checked)}
                className="w-4 h-4 rounded text-[#131313] accent-[#059669] focus:ring-0 cursor-pointer"
              />
              <span className="text-sm font-semibold text-[#131313]">Mailing & Delivery (Kirim via Ekspedisi)</span>
            </label>

            {hasDelivery && (
              <div className="pl-6.5 animate-in fade-in-50 duration-200">
                <textarea
                  rows={2}
                  name="shippingNotes"
                  value={formData.shippingNotes}
                  onChange={handleChange}
                  placeholder="Are there additional mailing or delivery fees and options? (misal: JNE / J&T / SiCepat reguler flat Rp 15.000 ke Jabodetabek atau bebas ongkir)"
                  className="w-full bg-[#FAF8F5] border border-[#E8E2D8] focus:border-[#131313] focus:bg-white text-xs text-[#131313] p-3 rounded-lg focus:outline-none transition leading-relaxed"
                />
              </div>
            )}
          </div>
        </div>

        {/* Seller City Domisili */}
        <div className="pt-3 border-t border-[#F2EADE]">
          <label className="block text-xs font-semibold text-[#4A4A48] mb-1.5">
            <span>Kota Domisili Penjual</span>
            <span className="text-[#F34431] font-bold ml-1">*</span>
          </label>
          <input
            type="text"
            required
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Contoh: Bandung, Jakarta Selatan, Surabaya"
            className="w-full px-3.5 py-2 rounded-lg border border-[#E8E2D8] focus:border-[#131313] focus:outline-none text-xs text-[#131313]"
          />
        </div>
      </div>

      {/* Action Buttons: Preview & Submit */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (imageUrls.length === 0) {
              setError("Unggah minimal 1 foto pakaian untuk melihat pratinjau iklan");
              return;
            }
            if (!formData.title.trim()) {
              setError("Masukkan judul pakaian terlebih dahulu untuk melihat pratinjau");
              return;
            }
            setError(null);
            setIsPreviewOpen(true);
          }}
          className="flex-1 py-3 px-4 bg-[#FAF8F5] hover:bg-[#F2EADE] text-[#131313] font-bold rounded-lg text-xs transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer border border-[#E8E2D8]"
        >
          <IconEye className="w-4 h-4 text-[#131313]" />
          <span>Pratinjau Tampilan Iklan (Preview)</span>
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-[#131313] hover:bg-[#282828] text-white font-bold py-3.5 rounded-lg text-xs transition active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {isSubmitting ? (
            isEdit ? "Menyimpan Perubahan..." : "Menerbitkan Listing..."
          ) : (
            <>
              <span>{isEdit ? "Simpan Perubahan Pakaian" : "Terbitkan Pakaian Thrift ke Seken."}</span>
              <IconArrowRight className="w-4 h-4 text-[#F34431]" />
            </>
          )}
        </button>
      </div>

      {/* Preview Modal Dialog */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E8E2D8] shadow-2xl space-y-4 my-8 animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <div>
                <span className="text-[10px] font-mono text-[#F34431] font-bold uppercase tracking-wider">
                  PRATINJAU IKLAN PEMBELI
                </span>
                <h3 className="font-black text-sm text-[#131313]">
                  Seperti Ini Tampilan Listing Anda
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="w-7 h-7 rounded-full bg-[#FAF8F5] border border-[#E8E2D8] flex items-center justify-center text-xs text-[#73736C] hover:text-[#131313] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Preview Card Mockup */}
            <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E2D8] space-y-3 text-xs">
              {/* Image Preview */}
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-[#F2EADE]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrls[coverIndex] || imageUrls[0]}
                  alt={formData.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 bg-[#131313]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  Asal Baleran: {countries.find((c) => c.code === formData.originCountryCode)?.flagEmoji}{" "}
                  {countries.find((c) => c.code === formData.originCountryCode)?.name || formData.originCountryCode}
                </span>
              </div>

              {/* Price & Title */}
              <div>
                <div className="text-xl font-black text-[#131313] mb-1">
                  {isFree ? "GRATIS / Rp 0" : `Rp ${Number(formData.price || 0).toLocaleString("id-ID")}`}
                </div>
                <h4 className="font-bold text-sm text-[#131313] leading-snug">
                  {formData.title || "Judul pakaian"}
                </h4>
              </div>

              {/* Measurements and Condition */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded bg-[#131313] text-white font-bold text-[10px]">
                  Tag: {formData.size}
                </span>

                {formData.lengthCm && formData.chestWidthCm && (
                  <span className="px-2 py-0.5 rounded bg-[#F2EADE] text-[#131313] font-mono font-bold text-[10px] border border-[#E8E2D8]">
                    📏 P: {formData.lengthCm} cm × L: {formData.chestWidthCm} cm
                  </span>
                )}

                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-200">
                  {CONDITION_OPTIONS.find((c) => c.value === formData.condition)?.label}
                </span>
              </div>

              {/* Defect Notes */}
              {formData.defectNotes && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-[11px] leading-relaxed">
                  <strong>Catatan Minus:</strong> {formData.defectNotes}
                </div>
              )}

              {/* Deal Methods */}
              <div className="pt-2 border-t border-[#E8E2D8]/70 text-[11px] space-y-1 text-[#575752]">
                <div>📍 <strong>Lokasi Penjual:</strong> {formData.city}</div>
                {hasMeetup && (
                  <div>🤝 <strong>Bisa COD:</strong> {formData.codArea || "Sesuai kesepakatan"}</div>
                )}
                {hasDelivery && (
                  <div>🚚 <strong>Ekspedisi:</strong> {formData.shippingNotes}</div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E2D8]">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-[#73736C] hover:text-[#131313] hover:bg-[#FAF8F5] transition cursor-pointer"
              >
                ← Edit Kembali
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-[#131313] hover:bg-[#282828] text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                {isSubmitting ? "Menerbitkan..." : "✓ Terbitkan Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
