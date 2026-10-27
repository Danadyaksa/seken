"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  IconMessage, 
  IconCheck, 
  IconX, 
  IconTag, 
  IconWhatsApp, 
  IconArrowRight,
  IconTruck,
  IconShieldCheck,
  IconBan
} from "@/components/Icons";

interface Profile {
  username: string;
  avatarUrl?: string | null;
  city?: string | null;
  whatsappNumber?: string | null;
}

interface UserInfo {
  id: string;
  name: string;
  profile?: Profile | null;
}

interface ProductSummary {
  id: string;
  title: string;
  price: number;
  status: string;
  originCountry: {
    name: string;
    flagEmoji: string;
  };
  images: { imageUrl: string }[];
}

interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

interface OfferItem {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  offeredPrice: number;
  status: string;
  createdAt: string;
}

interface ConversationItem {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  updatedAt: string;
  product: ProductSummary;
  buyer: UserInfo;
  seller: UserInfo;
  courierName?: string | null;
  trackingNumber?: string | null;
  shippingStatus?: string;
  shippedAt?: string | null;
  messages: MessageItem[];
  latestOffer?: OfferItem | null;
  isBlockedByMe?: boolean;
  amIBlocked?: boolean;
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [offerActionLoading, setOfferActionLoading] = useState(false);
  const [shippingCourier, setShippingCourier] = useState("J&T Express");
  const [shippingResi, setShippingResi] = useState("");
  const [isEditingResi, setIsEditingResi] = useState(false);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [copiedResi, setCopiedResi] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ignore = false;

    async function fetchConversations() {
      try {
        const res = await fetch("/api/conversations?role=buyer");
        if (ignore) return;
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations || []);
          setCurrentUserId(data.currentUserId);
          if (data.conversations?.length > 0 && !selectedConvId) {
            setSelectedConvId(data.conversations[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchConversations();

    return () => {
      ignore = true;
    };
  }, [selectedConvId, reloadKey]);

  const activeConv = conversations.find((c) => c.id === selectedConvId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConvId || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConvId,
          text: newMessage.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === selectedConvId) {
              return {
                ...c,
                messages: [...c.messages, data.message],
                updatedAt: new Date().toISOString(),
              };
            }
            return c;
          })
        );
        setNewMessage("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleOfferResponse = async (offerId: string, status: "ACCEPTED" | "DECLINED") => {
    setOfferActionLoading(true);
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const data = await res.json();
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === selectedConvId && c.latestOffer) {
              return {
                ...c,
                latestOffer: {
                  ...c.latestOffer,
                  status: data.offer.status,
                },
              };
            }
            return c;
          })
        );
      } else {
        const data = await res.json();
        alert(data.error || "Gagal merespons tawaran");
      }
    } catch {
      alert("Terjadi kesalahan jaringan");
    } finally {
      setOfferActionLoading(false);
    }
  };

  const handleSaveResi = async (convId: string) => {
    if (!shippingResi.trim()) {
      alert("Nomor resi pengiriman wajib diisi");
      return;
    }

    setShippingLoading(true);
    try {
      const res = await fetch(`/api/conversations/${convId}/shipping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-resi",
          courierName: shippingCourier,
          trackingNumber: shippingResi.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsEditingResi(false);
        setShippingResi("");
        setReloadKey((k) => k + 1);
        alert("Nomor resi berhasil diinput dan diinformasikan ke pembeli!");
      } else {
        alert(data.error || "Gagal menyimpan nomor resi");
      }
    } catch {
      alert("Terjadi kendala jaringan saat menyimpan resi.");
    } finally {
      setShippingLoading(false);
    }
  };

  const handleConfirmDelivered = async (convId: string) => {
    if (!confirm("Konfirmasi bahwa Anda telah menerima barang ini dengan kondisi sesuai?")) {
      return;
    }

    setShippingLoading(true);
    try {
      const res = await fetch(`/api/conversations/${convId}/shipping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm-delivered" }),
      });

      const data = await res.json();
      if (res.ok) {
        setReloadKey((k) => k + 1);
        alert("Pesanan telah ditandai selesai (Diterima). Terima kasih!");
      } else {
        alert(data.error || "Gagal memperbarui status");
      }
    } catch {
      alert("Terjadi kendala jaringan.");
    } finally {
      setShippingLoading(false);
    }
  };

  const handleCopyResi = (resi: string) => {
    navigator.clipboard.writeText(resi);
    setCopiedResi(true);
    setTimeout(() => setCopiedResi(false), 2000);
  };

  const handleToggleBlock = async (targetUserId: string, isCurrentlyBlocked: boolean) => {
    const actionText = isCurrentlyBlocked ? "membuka blokir" : "memblokir";
    if (!confirm(`Apakah Anda yakin ingin ${actionText} pengguna ini?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/users/${targetUserId}/block`, { method: "POST" });
      if (res.ok) {
        setReloadKey((k) => k + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="h-96 bg-[#F2EADE] rounded-xl animate-pulse"></div>
      </main>
    );
  }

  if (!currentUserId) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 rounded-xl bg-[#F2EADE] text-[#4A4A48] mx-auto flex items-center justify-center mb-3">
          <IconMessage className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-[#131313] mb-2">Masuk ke Kotak Pesan</h1>
        <p className="text-[#4A4A48] text-xs mb-6">
          Silakan login untuk melihat negosiasi harga dan percakapan pakaian thrift Anda.
        </p>
        <Link
          href="/auth/login?redirect=/inbox"
          className="inline-flex px-5 py-2 bg-[#131313] hover:bg-[#282828] text-white rounded-lg font-semibold text-xs transition"
        >
          Masuk Sekarang
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-4 pb-3 border-b border-[#E8E0D5] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#131313] tracking-tight">
              Inbox Chat Pembelian
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#131313] text-[#FAF8F5] px-2 py-0.5 rounded">
              Mode Belanja
            </span>
          </div>
          <p className="text-xs text-[#4A4A48] mt-0.5">
            Riwayat percakapan dan tawaran harga pakaian vintage yang Anda incar dari toko penjual.
          </p>
        </div>
        <Link
          href="/seller/inbox"
          className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-semibold text-[#131313] bg-[#F2EADE] hover:bg-[#E8E0D5] px-3.5 py-1.5 rounded-lg transition"
        >
          <span>Buka Inbox Toko Penjual</span>
          <IconArrowRight className="w-3.5 h-3.5 text-[#F34431]" />
        </Link>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-[#E8E0D5] mt-4 px-4">
          <div className="w-12 h-12 bg-[#F2EADE] rounded-xl flex items-center justify-center mx-auto text-[#7E7E77] mb-3">
            <IconMessage className="w-6 h-6 text-[#131313]" />
          </div>
          <h3 className="font-bold text-[#131313] text-sm mb-1">
            Belum Ada Chat Pembelian Pakaian
          </h3>
          <p className="text-xs text-[#7E7E77] max-w-sm mx-auto mb-5 leading-relaxed">
            Tertarik dengan jaket baleran, hoodie vintage, atau celana impor? Hubungi penjual langsung atau ajukan penawaran harga dari katalog pakaian.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#131313] hover:bg-[#282828] px-4 py-2 rounded-lg transition"
          >
            <span>Jelajahi Katalog Pakaian</span>
            <IconArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E0D5] overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[680px]">
          {/* Conversation List (Left Column) */}
          <div
            className={`md:col-span-4 border-r border-[#E8E0D5] flex flex-col h-full ${
              selectedConvId ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="p-3 border-b border-[#E8E0D5] bg-[#FAF8F5] font-semibold text-xs text-[#131313]">
              Daftar Percakapan ({conversations.length})
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#F2EADE]">
              {conversations.map((conv) => {
                const isSeller = conv.sellerId === currentUserId;
                const otherParty = isSeller ? conv.buyer : conv.seller;
                const isSelected = conv.id === selectedConvId;
                const lastMsg = conv.messages[conv.messages.length - 1];
                const productImg = conv.product.images[0]?.imageUrl || "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=200";

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full p-3 text-left flex items-start gap-3 transition cursor-pointer ${
                      isSelected ? "bg-[#F2EADE]" : "hover:bg-[#FAF8F5]"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={productImg}
                      alt={conv.product.title}
                      className="w-11 h-11 rounded-lg object-cover shrink-0 border border-[#E8E0D5]"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-xs text-[#131313] truncate">
                          {otherParty.name}
                        </span>
                        <span className="text-xs text-[#7E7E77] shrink-0">
                          {new Date(conv.updatedAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <p className="text-[11px] font-medium text-[#4A4A48] truncate mb-0.5">
                        {conv.product.title}
                      </p>

                      <p className="text-[10px] text-[#7E7E77] truncate">
                        {lastMsg ? lastMsg.text : "Belum ada pesan"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Chat Thread (Right Column) */}
          <div
            className={`md:col-span-8 flex flex-col h-full bg-[#FAF8F5] ${
              !selectedConvId ? "hidden md:flex items-center justify-center" : "flex"
            }`}
          >
            {activeConv ? (
              <>
                {/* Chat Header */}
                <div className="p-3 bg-white border-b border-[#E8E0D5] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => setSelectedConvId(null)}
                      className="md:hidden p-1 text-[#7E7E77] hover:text-[#131313]"
                    >
                      ←
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h2 className="font-bold text-xs sm:text-sm text-[#131313] truncate">
                          {activeConv.sellerId === currentUserId
                            ? activeConv.buyer.name
                            : activeConv.seller.name}
                        </h2>
                        <span className="text-xs font-medium bg-[#F2EADE] text-[#4A4A48] px-2 py-0.5 rounded">
                          {activeConv.sellerId === currentUserId ? "Pembeli" : "Penjual"}
                        </span>
                      </div>
                      <p className="text-xs text-[#7E7E77] truncate">
                        {activeConv.sellerId === currentUserId
                          ? activeConv.buyer.profile?.city || "Indonesia"
                          : activeConv.seller.profile?.city || "Indonesia"}
                      </p>
                    </div>
                  </div>

                  {/* Actions & WhatsApp Handshake */}
                  <div className="flex items-center gap-2">
                    {/* WhatsApp Handshake Button */}
                    {activeConv.seller.profile?.whatsappNumber && (
                      <a
                        href={`https://wa.me/${activeConv.seller.profile.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                          `Halo, saya ingin melanjutkan transaksi pakaian "${activeConv.product.title}" dari Seken..`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#059669] hover:bg-[#047857] text-white rounded-lg text-xs font-bold transition"
                      >
                        <IconWhatsApp className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>
                    )}

                    <Link
                      href={`/products/${activeConv.product.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F2EADE] hover:bg-[#E8E0D5] text-[#131313] rounded-lg text-xs font-semibold transition"
                    >
                      <span className="hidden sm:inline">Lihat Listing</span> →
                    </Link>

                    {/* Block / Unblock User Action */}
                    <button
                      type="button"
                      onClick={() => {
                        const targetId = activeConv.sellerId === currentUserId ? activeConv.buyerId : activeConv.sellerId;
                        handleToggleBlock(targetId, !!activeConv.isBlockedByMe);
                      }}
                      title={activeConv.isBlockedByMe ? "Buka Blokir Pengguna Ini" : "Blokir Pengguna Ini"}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer ${
                        activeConv.isBlockedByMe
                          ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          : "text-[#575752] border-[#E8E0D5] hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50"
                      }`}
                    >
                      <IconBan className="w-3.5 h-3.5 text-rose-500" />
                      <span className="hidden sm:inline">
                        {activeConv.isBlockedByMe ? "Buka Blokir" : "Blokir"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Offer Notification Banner (if any) */}
                {activeConv.latestOffer && (
                  <div className="mx-3 mt-3 p-3 bg-white border border-[#E8E0D5] rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-[#F2EADE] text-[#131313] flex items-center justify-center shrink-0">
                        <IconTag className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#131313] tabular-nums">
                            Tawaran: Rp {activeConv.latestOffer.offeredPrice.toLocaleString("id-ID")}
                          </span>
                          <span className="text-xs text-[#7E7E77] line-through tabular-nums">
                            Rp {activeConv.product.price.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <span
                          className={`inline-block mt-0.5 text-xs font-semibold px-2 py-0.5 rounded ${
                            activeConv.latestOffer.status === "PENDING"
                              ? "bg-amber-100 text-amber-900"
                              : activeConv.latestOffer.status === "ACCEPTED"
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-rose-100 text-rose-900"
                          }`}
                        >
                          {activeConv.latestOffer.status === "PENDING"
                            ? "Menunggu Respon Penjual"
                            : activeConv.latestOffer.status === "ACCEPTED"
                            ? "Tawaran Disetujui"
                            : "Tawaran Ditolak"}
                        </span>
                      </div>
                    </div>

                    {/* If seller and offer pending, show Accept / Decline buttons */}
                    {activeConv.sellerId === currentUserId &&
                      activeConv.latestOffer.status === "PENDING" && (
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            type="button"
                            disabled={offerActionLoading}
                            onClick={() =>
                              handleOfferResponse(activeConv.latestOffer!.id, "ACCEPTED")
                            }
                            className="inline-flex items-center gap-1 px-3 py-1 bg-[#059669] hover:bg-[#047857] text-white rounded-md text-xs font-bold transition cursor-pointer"
                          >
                            <IconCheck className="w-3.5 h-3.5" />
                            <span>Terima</span>
                          </button>
                          <button
                            type="button"
                            disabled={offerActionLoading}
                            onClick={() =>
                              handleOfferResponse(activeConv.latestOffer!.id, "DECLINED")
                            }
                            className="inline-flex items-center gap-1 px-3 py-1 bg-[#F2EADE] hover:bg-[#E8E0D5] text-[#131313] rounded-md text-xs font-bold transition cursor-pointer"
                          >
                            <IconX className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </button>
                        </div>
                      )}
                  </div>
                )}

                {/* Shipping & Resi Tracking Panel (Manual Tracking) */}
                {(activeConv.latestOffer?.status === "ACCEPTED" ||
                  activeConv.product.status === "RESERVED" ||
                  activeConv.product.status === "SOLD" ||
                  activeConv.trackingNumber) && (
                  <div className="mx-3 mt-2.5 p-3 bg-[#FAF8F5] border border-[#E8E0D5] rounded-lg">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 text-[#131313]">
                        <IconTruck className="w-4 h-4 text-[#131313]" />
                        <span className="text-xs font-semibold text-[#131313]">
                          Status Pengiriman & No. Resi
                        </span>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          activeConv.shippingStatus === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-800"
                            : activeConv.shippingStatus === "SHIPPED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {activeConv.shippingStatus === "DELIVERED"
                          ? "✓ Barang Diterima"
                          : activeConv.shippingStatus === "SHIPPED"
                          ? "Dalam Pengiriman"
                          : "Menunggu Resi"}
                      </span>
                    </div>

                    {/* Resi Information Display */}
                    {activeConv.trackingNumber && !isEditingResi ? (
                      <div className="bg-white p-2.5 rounded border border-[#E8E0D5] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#131313]">
                              {activeConv.courierName || "Ekspedisi"}
                            </span>
                            <span className="font-bold text-xs text-[#F34431] tabular-nums">
                              {activeConv.trackingNumber}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#7E7E77]">
                            {activeConv.shippedAt
                              ? `Dikirim pada ${new Date(activeConv.shippedAt).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`
                              : "Pengiriman telah diproses"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleCopyResi(activeConv.trackingNumber!)}
                            className="px-2.5 py-1 bg-[#F2EADE] hover:bg-[#E8E0D5] text-[#131313] text-[11px] font-semibold rounded transition cursor-pointer"
                          >
                            {copiedResi ? "✓ Tersalin" : "Salin Resi"}
                          </button>
                          <a
                            href={`https://www.google.com/search?q=cek+resi+${encodeURIComponent(
                              `${activeConv.courierName || ""} ${activeConv.trackingNumber}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-[#131313] hover:bg-[#282828] text-white text-[11px] font-semibold rounded transition"
                          >
                            Lacak Web Ekspedisi ↗
                          </a>
                          {activeConv.sellerId === currentUserId && (
                            <button
                              type="button"
                              onClick={() => {
                                setShippingCourier(activeConv.courierName || "J&T Express");
                                setShippingResi(activeConv.trackingNumber || "");
                                setIsEditingResi(true);
                              }}
                              className="px-2 py-1 text-[11px] text-[#7E7E77] hover:text-[#131313] hover:underline cursor-pointer"
                            >
                              Ubah
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Seller Input Form for Resi */
                      activeConv.sellerId === currentUserId && (
                        <div className="bg-white p-2.5 rounded border border-[#E8E0D5]">
                          <span className="text-[10px] font-medium text-[#4A4A48] block mb-1.5">
                            Input data pengiriman setelah pakaian dikirim ke kurir:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <select
                              value={shippingCourier}
                              onChange={(e) => setShippingCourier(e.target.value)}
                              className="px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded font-medium focus:outline-none focus:border-[#131313]"
                            >
                              <option value="J&T Express">J&T Express</option>
                              <option value="JNE Reguler">JNE</option>
                              <option value="SiCepat">SiCepat</option>
                              <option value="Anteraja">Anteraja</option>
                              <option value="Wahana">Wahana</option>
                              <option value="Lion Parcel">Lion Parcel</option>
                              <option value="GoSend / GrabExpress (Instant)">GoSend / Grab</option>
                              <option value="COD / Ketemuan Langsung">COD / Handshake</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Nomor Resi Pengiriman"
                              value={shippingResi}
                              onChange={(e) => setShippingResi(e.target.value)}
                              className="px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8E0D5] rounded focus:outline-none focus:border-[#131313]"
                            />
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={shippingLoading}
                                onClick={() => handleSaveResi(activeConv.id)}
                                className="flex-1 px-3 py-1.5 bg-[#131313] hover:bg-[#282828] text-white text-xs font-bold rounded transition cursor-pointer disabled:opacity-50"
                              >
                                {shippingLoading ? "Menyimpan..." : "Kirim Resi"}
                              </button>
                              {isEditingResi && (
                                <button
                                  type="button"
                                  onClick={() => setIsEditingResi(false)}
                                  className="px-2 py-1.5 text-xs text-[#7E7E77] hover:text-[#131313]"
                                >
                                  Batal
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    )}

                    {/* Buyer Confirmation Button */}
                    {activeConv.buyerId === currentUserId &&
                      activeConv.shippingStatus === "SHIPPED" && (
                        <div className="mt-2 pt-2 border-t border-[#E8E0D5] flex items-center justify-between gap-2">
                          <span className="text-[10px] text-[#4A4A48]">
                            Sudah menerima paket pakaian dan memeriksa kondisi fisiknya?
                          </span>
                          <button
                            type="button"
                            disabled={shippingLoading}
                            onClick={() => handleConfirmDelivered(activeConv.id)}
                            className="px-3 py-1 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded transition cursor-pointer"
                          >
                            ✓ Konfirmasi Diterima
                          </button>
                        </div>
                      )}
                  </div>
                )}

                {/* Safety Warning Banner (Anti-Fraud & Inspection Education) */}
                <div className="mx-3 mt-2.5 px-3 py-2 bg-amber-50/80 border border-amber-200/80 rounded-lg flex items-start gap-2 text-[11px] text-amber-950 leading-snug">
                  <IconShieldCheck className="shrink-0 w-4 h-4 text-amber-700 mt-0.5" />
                  <div>
                    <span className="font-bold">Panduan Keamanan C2C: </span>
                    SEKEN tidak menggunakan payment gateway atau rekening bersama (escrow). Seluruh pembayaran dan kesepakatan transaksi dilakukan langsung antar-pengguna. Nomor resi pengiriman adalah rujukan kurir, bukan jaminan escrow otomatis.
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
                  {activeConv.messages.map((msg) => {
                    const isMe = msg.senderId === currentUserId;
                    const isOfferNotice = msg.text.includes("🏷️") || msg.text.includes("✅") || msg.text.includes("❌");

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3.5 py-2 text-xs ${
                            isOfferNotice
                              ? "bg-[#F2EADE] border border-[#E8E0D5] text-[#131313] font-medium"
                              : isMe
                              ? "bg-[#131313] text-white"
                              : "bg-white text-[#131313] border border-[#E8E0D5]"
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-[#7E7E77] mt-1 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input or Block Notice */}
                {activeConv.isBlockedByMe ? (
                  <div className="p-4 bg-rose-50/80 border-t border-rose-200 text-center">
                    <p className="text-xs font-bold text-rose-800">
                      Anda telah memblokir pengguna ini.
                    </p>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      Pengguna ini tidak dapat mengirimkan pesan atau mengajukan penawaran harga kepada Anda.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const targetId = activeConv.sellerId === currentUserId ? activeConv.buyerId : activeConv.sellerId;
                        handleToggleBlock(targetId, true);
                      }}
                      className="mt-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      Buka Blokir Sekarang
                    </button>
                  </div>
                ) : activeConv.amIBlocked ? (
                  <div className="p-4 bg-stone-100 border-t border-stone-200 text-center">
                    <p className="text-xs font-bold text-stone-700">
                      Interaksi Dibatasi
                    </p>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      Pengguna ini telah membatasi interaksi dengan akun Anda. Anda tidak dapat mengirim pesan atau mengajukan tawaran.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSendMessage}
                    className="p-3 bg-white border-t border-[#E8E0D5] flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Tulis pesan negosiasi atau tanya detail pakaian..."
                      className="flex-1 bg-[#F2EADE] rounded-lg px-3.5 py-2 text-xs text-[#131313] border border-[#E4E4DC] focus:border-[#131313] focus:outline-none transition"
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="px-4 py-2 rounded-lg bg-[#131313] hover:bg-[#282828] disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Kirim
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div className="text-center text-[#7E7E77] text-xs">
                Pilih salah satu percakapan di sebelah kiri untuk membaca pesan
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
