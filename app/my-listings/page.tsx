"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  IconPlus, 
  IconAlert, 
  IconArrowRight, 
  IconTag,
  IconRocket,
  IconStar
} from "@/components/Icons";
import SellerSidebarLayout, { SafeUser } from "@/components/SellerSidebarLayout";

interface ProductItem {
  id: string;
  title: string;
  price: number;
  size: string;
  chestWidthCm?: number | null;
  lengthCm?: number | null;
  condition: string;
  status: string;
  viewCount: number;
  isSpotlight?: boolean;
  bumpedAt?: string;
  createdAt: string;
  originCountry: {
    name: string;
    flagEmoji: string;
  };
  category: {
    name: string;
  };
  images: {
    id: string;
    imageUrl: string;
  }[];
  _count?: {
    offers: number;
  };
}

export default function MyListingsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);

  useEffect(() => {
    let ignore = false;

    async function checkAuthAndFetch() {
      try {
        const authRes = await fetch("/api/auth/me");
        if (ignore) return;
        if (!authRes.ok) {
          setIsAuth(false);
          setLoading(false);
          return;
        }
        const authData = await authRes.json();
        if (ignore) return;
        if (!authData.user) {
          setIsAuth(false);
          setLoading(false);
          return;
        }
        setIsAuth(true);
        setCurrentUser(authData.user);

        // Fetch user's listings
        const res = await fetch(`/api/products?sellerId=${authData.user.id}`);
        if (ignore) return;
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch {
        if (!ignore) setErrorMsg("Gagal memuat inventaris pakaian Anda.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    checkAuthAndFetch();

    return () => {
      ignore = true;
    };
  }, []);

  const handleStatusChange = async (productId: string, newStatus: string) => {
    setActionLoadingId(productId);
    try {
      const res = await fetch(`/api/products/${productId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((item) =>
            item.id === productId ? { ...item, status: newStatus } : item
          )
        );
      } else {
        const err = await res.json();
        alert(err.error || "Gagal mengubah status");
      }
    } catch {
      alert("Terjadi kendala jaringan.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (productId: string, title: string) => {
    if (!confirm(`Hapus listing "${title}" dari katalog?`)) {
      return;
    }

    setActionLoadingId(productId);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProducts((prev) => prev.filter((item) => item.id !== productId));
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menghapus produk");
      }
    } catch {
      alert("Terjadi kesalahan teknis");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBump = async (productId: string, title: string) => {
    setActionLoadingId(productId);
    try {
      const res = await fetch(`/api/products/${productId}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bump" }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`🚀 Berhasil! "${title}" telah di-bump dan kini berada di urutan teratas katalog beranda.`);
        // Refresh local listing timestamp
        setProducts((prev) =>
          prev.map((item) =>
            item.id === productId ? { ...item, bumpedAt: new Date().toISOString() } : item
          )
        );
      } else {
        alert(data.error || "Gagal melakukan bump iklan");
      }
    } catch {
      alert("Terjadi kendala jaringan saat melakukan bump.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleSpotlight = async (productId: string) => {
    setActionLoadingId(productId);
    try {
      const res = await fetch(`/api/products/${productId}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-spotlight" }),
      });

      const data = await res.json();
      if (res.ok) {
        setProducts((prev) =>
          prev.map((item) =>
            item.id === productId ? { ...item, isSpotlight: data.isSpotlight } : item
          )
        );
        alert(data.message);
      } else {
        alert(data.error || "Gagal mengubah status spotlight");
      }
    } catch {
      alert("Terjadi kendala jaringan.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (filterStatus === "ALL") return true;
    return p.status === filterStatus;
  });

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-48 bg-[#E8E0D5] rounded"></div>
          <div className="h-10 w-full max-w-sm bg-[#E8E0D5] rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-[#F2EADE] rounded-xl"></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (isAuth === false) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 rounded-xl bg-[#F2EADE] text-[#F34431] mx-auto flex items-center justify-center mb-3">
          <IconAlert className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-[#131313] mb-2">Akses Terbatas</h1>
        <p className="text-[#4A4A48] text-xs mb-6">
          Silakan masuk ke akun penjual Anda untuk mengelola inventaris pakaian thrift.
        </p>
        <Link
          href="/auth/login?redirect=/my-listings"
          className="inline-flex items-center justify-center px-5 py-2 bg-[#131313] hover:bg-[#282828] text-white rounded-lg font-semibold text-xs transition"
        >
          Masuk Sekarang
        </Link>
      </main>
    );
  }

  return (
    <SellerSidebarLayout user={currentUser}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E8E0D5]">
        <div>
          <h1 className="text-2xl font-black text-[#131313] tracking-tight">
            Kelola Listing Saya
          </h1>
          <p className="text-xs text-[#4A4A48] mt-1">
            Perbarui status ketersediaan barang (Tersedia, Dibooking, Terjual) dan pantau penawaran.
          </p>
        </div>

        <Link
          href="/sell"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#131313] hover:bg-[#282828] text-white font-semibold text-xs rounded-lg transition self-start sm:self-auto cursor-pointer"
        >
          <IconPlus className="w-3.5 h-3.5" />
          <span>Jual Pakaian Baru</span>
        </Link>
      </div>

      {/* Segmented Filter Tabs */}
      <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: "ALL", label: "Semua Listing", count: products.length },
          { id: "AVAILABLE", label: "Tersedia", count: products.filter((p) => p.status === "AVAILABLE").length },
          { id: "RESERVED", label: "Dibooking", count: products.filter((p) => p.status === "RESERVED").length },
          { id: "SOLD", label: "Terjual", count: products.filter((p) => p.status === "SOLD").length },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
              filterStatus === tab.id
                ? "bg-[#131313] text-white border-[#131313]"
                : "bg-white text-[#4A4A48] border-[#E8E0D5] hover:border-[#131313]"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Product List */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-[#E8E0D5] mt-6 px-4">
          <div className="w-12 h-12 bg-[#F2EADE] rounded-xl flex items-center justify-center mx-auto text-[#7E7E77] mb-3">
            <IconTag className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-[#131313] text-sm mb-1">
            Belum Ada Listing di Tab Ini
          </h3>
          <p className="text-xs text-[#7E7E77] max-w-sm mx-auto mb-4">
            Pakaian thrift yang Anda unggah akan muncul di sini untuk dikelola status dan tawarannya.
          </p>
          <Link
            href="/sell"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#131313] bg-[#F2EADE] hover:bg-[#E8E0D5] px-4 py-2 rounded-lg transition"
          >
            <span>Mulai Listing Pakaian</span>
            <IconArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {filteredProducts.map((p) => {
            const isProcessing = actionLoadingId === p.id;
            const primaryImg = p.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=500";

            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-[#E8E0D5] overflow-hidden flex flex-col transition"
              >
                {/* Image Header */}
                <div className="relative aspect-[4/3] bg-[#F2EADE] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={primaryImg}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-[#131313]/85 backdrop-blur-xs text-white text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1">
                    <span>{p.originCountry.flagEmoji}</span>
                    <span>{p.originCountry.name}</span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded shadow-xs ${
                        p.status === "AVAILABLE"
                          ? "bg-emerald-600 text-white"
                          : p.status === "RESERVED"
                          ? "bg-amber-400 text-amber-950"
                          : "bg-stone-700 text-white"
                      }`}
                    >
                      {p.status === "AVAILABLE"
                        ? "Tersedia"
                        : p.status === "RESERVED"
                        ? "Dibooking"
                        : "Terjual"}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-[#7E7E77] mb-1">
                      <span>{p.category.name}</span>
                      <span>·</span>
                      <span className="font-bold text-[#131313]">Size {p.size}</span>
                      {p.chestWidthCm && p.lengthCm && (
                        <>
                          <span>·</span>
                          <span>P {p.lengthCm} × L {p.chestWidthCm} cm</span>
                        </>
                      )}
                    </div>

                    <h3 className="font-bold text-[#131313] text-xs sm:text-sm line-clamp-2 leading-snug mb-2">
                      {p.title}
                    </h3>

                    <p className="font-extrabold text-sm sm:text-base text-[#131313] tabular-nums mb-3">
                      Rp {p.price.toLocaleString("id-ID")}
                    </p>

                    <div className="flex items-center justify-between text-xs text-[#7E7E77] py-2 border-y border-[#F2EADE]">
                      <span>{p.viewCount} Dilihat</span>
                      <span>
                        {new Date(p.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Promotion Controls (Bump & Spotlight) */}
                  <div className="mt-3 pt-3 border-t border-[#F2EADE]">
                    <span className="text-xs font-semibold text-[#4A4A48] block mb-1.5">
                      Promosi & Visibilitas
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 mb-3">
                      <button
                        type="button"
                        disabled={isProcessing || p.status === "SOLD"}
                        onClick={() => handleBump(p.id, p.title)}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 text-[11px] font-bold rounded border border-[#131313] bg-white hover:bg-[#131313] hover:text-white text-[#131313] transition active:scale-[0.98] cursor-pointer disabled:opacity-40"
                        title="Perbarui tanggal listing agar melompat ke urutan paling atas beranda"
                      >
                        <IconRocket className="w-3.5 h-3.5" />
                        <span>Bump Iklan</span>
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing || p.status === "SOLD"}
                        onClick={() => handleToggleSpotlight(p.id)}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-[11px] font-bold rounded border transition active:scale-[0.98] cursor-pointer disabled:opacity-40 ${
                          p.isSpotlight
                            ? "bg-[#F34431] text-white border-[#F34431]"
                            : "bg-[#FFF9F9] text-[#F34431] border-[#F34431]/40 hover:bg-[#F34431] hover:text-white"
                        }`}
                        title="Tampilkan lencana Spotlight dan prioritas etalase"
                      >
                        <IconStar className="w-3.5 h-3.5" />
                        <span>{p.isSpotlight ? "Spotlight On" : "Spotlight"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Status Toggles & Actions */}
                  <div className="mt-1">
                    <span className="text-xs font-semibold text-[#4A4A48] block mb-1.5">
                      Ubah Status Barang
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                      <button
                        type="button"
                        disabled={isProcessing || p.status === "AVAILABLE"}
                        onClick={() => handleStatusChange(p.id, "AVAILABLE")}
                        className={`py-1.5 text-[11px] font-bold rounded border transition cursor-pointer ${
                          p.status === "AVAILABLE"
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                            : "border-[#E8E0D5] text-[#4A4A48] hover:bg-[#F2EADE]"
                        }`}
                      >
                        Tersedia
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing || p.status === "RESERVED"}
                        onClick={() => handleStatusChange(p.id, "RESERVED")}
                        className={`py-1.5 text-[11px] font-bold rounded border transition cursor-pointer ${
                          p.status === "RESERVED"
                            ? "bg-amber-50 border-amber-300 text-amber-800"
                            : "border-[#E8E0D5] text-[#4A4A48] hover:bg-[#F2EADE]"
                        }`}
                      >
                        Booking
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing || p.status === "SOLD"}
                        onClick={() => handleStatusChange(p.id, "SOLD")}
                        className={`py-1.5 text-[11px] font-bold rounded border transition cursor-pointer ${
                          p.status === "SOLD"
                            ? "bg-[#131313] border-[#131313] text-white"
                            : "border-[#E8E0D5] text-[#4A4A48] hover:bg-[#F2EADE]"
                        }`}
                      >
                        Terjual
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-[#F2EADE] pt-2.5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/products/${p.id}/edit`}
                          className="text-xs font-semibold text-[#131313] bg-[#F2EADE] hover:bg-[#E8E2D8] px-2.5 py-1 rounded transition"
                        >
                          Edit Pakaian
                        </Link>
                        <Link
                          href={`/products/${p.id}`}
                          className="text-xs font-semibold text-[#575752] hover:text-[#131313] transition"
                        >
                          Lihat Publik →
                        </Link>
                      </div>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleDelete(p.id, p.title)}
                        className="text-xs font-medium text-[#F34431] hover:underline transition cursor-pointer disabled:opacity-50"
                      >
                        Hapus Listing
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </SellerSidebarLayout>
  );
}
