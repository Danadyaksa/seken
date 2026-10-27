"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  IconTag, 
  IconWhatsApp, 
  IconCheck, 
  IconX, 
  IconHeart,
  IconHeartFilled,
  IconShare,
  IconCompare
} from "@/components/Icons";
import AddToWishlistModal from "@/components/AddToWishlistModal";

interface ProductDetailClientProps {
  product: {
    id: string;
    title: string;
    price: number;
    status: string;
    sellerId: string;
    size?: string;
    chestWidthCm?: number | null;
    lengthCm?: number | null;
    images?: { imageUrl: string }[];
    seller: {
      id: string;
      name: string;
      profile?: {
        username: string;
        whatsappNumber?: string | null;
        city?: string | null;
      } | null;
    };
  };
  currentUser: {
    id: string;
    name: string;
  } | null;
}

export default function ProductDetailClient({ product, currentUser }: ProductDetailClientProps) {
  const router = useRouter();
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [offeredPrice, setOfferedPrice] = useState<number>(Math.round(product.price * 0.9));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState<string | null>(null);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("COUNTERFEIT");
  const [reportNotes, setReportNotes] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const isOwner = currentUser?.id === product.sellerId;
  const isAvailable = product.status === "AVAILABLE";
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(14);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetch("/api/favorites")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.favorites) {
            const found = data.favorites.some((f: { productId: string }) => f.productId === product.id);
            setIsLiked(found);
          }
        })
        .catch(() => {});
    }
  }, [currentUser, product.id]);

  const formatRupiah = (val: number) => {
    if (val === 0) return "GRATIS";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleToggleLike = async () => {
    if (!currentUser) {
      router.push(`/auth/login?redirect=/products/${product.id}`);
      return;
    }

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.favorited);
        setLikesCount((c) => (data.favorited ? c + 1 : Math.max(0, c - 1)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Cek pakaian thrift vintage ini di Seken.: ${product.title}`,
          url: window.location.href,
        });
      } catch {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMakeOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      router.push(`/auth/login?redirect=/products/${product.id}`);
      return;
    }

    setIsSubmitting(true);
    setOfferError(null);

    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          offeredPrice,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengajukan tawaran");
      }

      setOfferSuccess(`Tawaran sebesar ${formatRupiah(offeredPrice)} berhasil dikirimkan ke penjual!`);
      setTimeout(() => {
        setIsOfferOpen(false);
        setOfferSuccess(null);
      }, 2500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setOfferError(err.message);
      } else {
        setOfferError("Terjadi kesalahan teknis");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp Redirect Handshake (Direct C2C)
  const getWhatsAppUrl = () => {
    const rawNumber = product.seller.profile?.whatsappNumber || "081298765432";
    let formattedNumber = rawNumber.replace(/[^0-9]/g, "");
    if (formattedNumber.startsWith("0")) {
      formattedNumber = "62" + formattedNumber.slice(1);
    }

    const priceText = product.price === 0 ? "GRATIS / FREE" : formatRupiah(product.price);
    const message = `Halo ${product.seller.name}, saya melihat pakaian thrift Anda di Seken.:\n\n*${product.title}*\nHarga: ${priceText}\nLink: ${typeof window !== "undefined" ? window.location.href : ""}\n\nApakah barang ini masih tersedia dan bagaimana opsi pengirimannya? Terima kasih.`;

    return `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/products/${product.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      router.push(`/auth/login?redirect=/products/${product.id}`);
      return;
    }

    setReportLoading(true);
    setReportError(null);
    try {
      const res = await fetch(`/api/products/${product.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason, notes: reportNotes }),
      });
      const data = await res.json();
      if (res.ok) {
        setReportSuccess(data.message);
        setTimeout(() => {
          setIsReportOpen(false);
          setReportSuccess(null);
          setReportNotes("");
        }, 2200);
      } else {
        throw new Error(data.error || "Gagal mengirim laporan");
      }
    } catch (err: unknown) {
      setReportError(err instanceof Error ? err.message : "Terjadi kesalahan saat melaporkan");
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <>
      {/* Carousell Action Box */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E0D5] space-y-3.5 shadow-xs">
        {isOwner ? (
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[#7E7E77] block">
              Kelola Status Barang:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {product.status === "AVAILABLE" && (
                <button
                  type="button"
                  onClick={() => handleStatusChange("RESERVED")}
                  className="py-2.5 px-3 bg-amber-400 hover:bg-amber-500 text-stone-900 font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  Tandai Dibooking
                </button>
              )}
              {product.status !== "SOLD" && (
                <button
                  type="button"
                  onClick={() => handleStatusChange("SOLD")}
                  className="py-2.5 px-3 bg-[#131313] hover:bg-[#282828] text-white font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  Tandai Terjual
                </button>
              )}
              {product.status === "SOLD" && (
                <button
                  type="button"
                  onClick={() => handleStatusChange("AVAILABLE")}
                  className="py-2.5 px-3 bg-[#131313] hover:bg-[#282828] text-white font-bold rounded-lg text-xs transition col-span-2 cursor-pointer"
                >
                  Aktifkan Kembali
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Primary Chat Button (Signal Red Carousell Style) */}
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-[#F34431] hover:bg-[#d83523] text-white transition active:scale-98 cursor-pointer shadow-sm"
            >
              <IconWhatsApp className="w-4 h-4" />
              <span>Chat dengan Penjual</span>
            </a>

            {/* Make Offer Button (Outline Secondary) */}
            {product.price > 0 && (
              <button
                type="button"
                onClick={() => setIsOfferOpen(true)}
                disabled={!isAvailable}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs border border-[#131313] text-[#131313] hover:bg-[#FAF8F5] transition active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <IconTag className="w-3.5 h-3.5 text-[#F34431]" />
                <span>Make Offer (Ajukan Tawaran)</span>
              </button>
            )}

            {/* C2C Payment & Safety Notice */}
            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E8E2D8] text-[10px] text-[#73736C] leading-relaxed">
              <strong className="text-[#131313]">⚠️ Panduan C2C:</strong> Transaksi & pembayaran dilakukan langsung antara pembeli dan penjual (COD atau transfer mandiri). SEKEN tidak menyediakan layanan penampungan dana (escrow). Verifikasi kondisi barang dan reputasi toko sebelum mentransfer uang.
            </div>
          </div>
        )}

        {/* Secondary Actions: Like & Share */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E8E2D8]">
          <button
            type="button"
            onClick={handleToggleLike}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition duration-150 active:scale-[0.98] cursor-pointer ${
              isLiked 
                ? "bg-rose-50 text-rose-700 border-rose-200" 
                : "border-[#E8E2D8] text-[#3D3D3A] hover:bg-[#FAF8F5]"
            }`}
          >
            {isLiked ? (
              <IconHeartFilled className="w-3.5 h-3.5 text-rose-600" />
            ) : (
              <IconHeart className="w-3.5 h-3.5 text-[#7A7A73]" />
            )}
            <span>{likesCount} Suka</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border border-[#E8E2D8] text-[#3D3D3A] hover:bg-[#FAF8F5] transition duration-150 active:scale-[0.98] cursor-pointer"
          >
            {copied ? (
              <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <IconShare className="w-3.5 h-3.5 text-[#7A7A73]" />
            )}
            <span>{copied ? "Tersalin!" : "Bagikan"}</span>
          </button>
        </div>

        {/* Compare Button */}
        <button
          type="button"
          onClick={() => router.push(`/compare?ids=${product.id}`)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold border border-[#E8E2D8] bg-[#F2EADE]/60 hover:bg-[#F2EADE] text-[#131313] transition duration-150 active:scale-[0.98] cursor-pointer"
        >
          <IconCompare className="w-3.5 h-3.5 text-[#575752]" />
          <span>Bandingkan Dimensi PxL Pakaian Ini</span>
        </button>

        {/* Report Listing */}
        {!isOwner && (
          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="w-full text-center text-[11px] text-[#A8A8A0] hover:text-[#F34431] transition cursor-pointer pt-1"
          >
            Laporkan Iklan Ini
          </button>
        )}
      </div>

      {/* Offer Modal */}
      {isOfferOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 border border-[#E8E0D5] shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setIsOfferOpen(false)}
              className="absolute right-3.5 top-3.5 p-1 rounded-md text-[#7E7E77] hover:bg-[#F2EADE] transition cursor-pointer"
            >
              <IconX className="w-4 h-4" />
            </button>

            <div className="text-center mb-4">
              <h3 className="font-extrabold text-base text-[#131313]">Tawar Harga Baju</h3>
              <p className="text-xs text-[#4A4A48] mt-0.5">
                Harga Pasang: <span className="font-bold text-[#131313] tabular-nums">{formatRupiah(product.price)}</span>
              </p>
            </div>

            {offerSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center font-medium">
                {offerSuccess}
              </div>
            )}

            {offerError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs text-center">
                {offerError}
              </div>
            )}

            <form onSubmit={handleMakeOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A4A48] mb-1.5">
                  Nominal Tawaran (IDR):
                </label>
                <input
                  type="number"
                  step="5000"
                  min="10000"
                  max={product.price}
                  value={offeredPrice}
                  onChange={(e) => setOfferedPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E4E4DC] focus:border-[#131313] focus:outline-none font-bold text-sm text-[#131313] tabular-nums transition"
                />
              </div>

              {/* Quick Percentage Presets */}
              <div className="grid grid-cols-3 gap-1.5">
                {[0.9, 0.85, 0.8].map((ratio) => {
                  const target = Math.round((product.price * ratio) / 5000) * 5000;
                  return (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setOfferedPrice(target)}
                      className="py-1.5 px-2 bg-[#F2EADE] hover:bg-[#E8E0D5] text-[#131313] text-[11px] font-semibold rounded transition cursor-pointer"
                    >
                      {Math.round(ratio * 100)}% ({formatRupiah(target)})
                    </button>
                  );
                })}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !!offerSuccess}
                className="w-full bg-[#131313] hover:bg-[#282828] text-white font-bold py-2.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Mengirim Tawaran..." : "Kirimkan Tawaran ke Penjual"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 border border-[#E8E0D5] shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setIsReportOpen(false)}
              className="absolute right-3.5 top-3.5 p-1 rounded-md text-[#7E7E77] hover:bg-[#F2EADE] transition cursor-pointer"
            >
              <IconX className="w-4 h-4" />
            </button>

            <div className="text-center mb-4">
              <h3 className="font-extrabold text-base text-[#131313]">Laporkan Iklan Ini</h3>
              <p className="text-xs text-[#4A4A48] mt-0.5">
                Bantu jaga ekosistem thrifting yang aman, jujur, dan terpercaya.
              </p>
            </div>

            {reportSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center font-medium">
                {reportSuccess}
              </div>
            )}

            {reportError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs text-center">
                {reportError}
              </div>
            )}

            <form onSubmit={handleSendReport} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#4A4A48] mb-1">
                  Alasan Pelaporan:
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FBFBF9] border border-[#E8E0D5] rounded-lg focus:outline-none focus:border-[#131313]"
                >
                  <option value="COUNTERFEIT">Barang Tiruan / Bukan Vintage Asli</option>
                  <option value="FRAUD">Indikasi Penipuan / Akun Mencurigakan</option>
                  <option value="MISMATCH">Ukuran PxL / Kondisi Minus Tidak Sesuai Foto</option>
                  <option value="OTHER">Pelanggaran Komunitas Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A4A48] mb-1">
                  Catatan Tambahan (Opsional):
                </label>
                <textarea
                  rows={3}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Jelaskan detail ketidaksesuaian atau indikasi penipuan..."
                  className="w-full px-3 py-2 text-xs bg-[#FBFBF9] border border-[#E8E0D5] rounded-lg focus:outline-none focus:border-[#131313] resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsReportOpen(false)}
                  className="flex-1 py-2 px-3 border border-[#E8E0D5] hover:bg-[#F2EADE] text-xs font-semibold rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={reportLoading || !!reportSuccess}
                  className="flex-1 py-2 px-3 bg-[#F34431] hover:bg-[#B31D1D] text-white text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
                >
                  {reportLoading ? "Mengirim..." : "Kirim Laporan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add To Wishlist Required Modal */}
      <AddToWishlistModal
        isOpen={isWishlistModalOpen}
        onClose={() => setIsWishlistModalOpen(false)}
        product={{
          id: product.id,
          title: product.title,
          price: product.price,
          size: product.size || "All Size",
          imageUrl: product.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400",
          chestWidthCm: product.chestWidthCm,
          lengthCm: product.lengthCm,
        }}
        onSuccessAdded={() => {
          setIsLiked(true);
          setLikesCount((c) => c + 1);
        }}
      />
    </>
  );
}
