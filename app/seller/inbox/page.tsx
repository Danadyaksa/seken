"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  IconMessage, 
  IconCheck, 
  IconX, 
  IconTag, 
  IconWhatsApp, 
  IconTruck,
  IconCopy,
  IconBan,
  IconStore,
  IconPlus
} from "@/components/Icons";
import SellerSidebarLayout, { SafeUser } from "@/components/SellerSidebarLayout";

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

export default function SellerInboxPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [filterTab, setFilterTab] = useState<"ALL" | "PENDING_OFFER" | "NEED_SHIPPING" | "SHIPPED">("ALL");

  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [offerActionLoading, setOfferActionLoading] = useState(false);
  const [shippingCourier, setShippingCourier] = useState("J&T Express");
  const [shippingResi, setShippingResi] = useState("");
  const [isEditingResi, setIsEditingResi] = useState(false);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [copiedResi, setCopiedResi] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

        // Fetch conversations where user is SELLER
        const res = await fetch("/api/conversations?role=seller");
        if (ignore) return;
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations || []);
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

    checkAuthAndFetch();

    return () => {
      ignore = true;
    };
  }, [selectedConvId]);

  const activeConv = conversations.find((c) => c.id === selectedConvId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || newMessage).trim();
    if (!text || !selectedConvId || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConvId,
          text,
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
        if (!textToSend) {
          setNewMessage("");
        }
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
            if (c.id === selectedConvId) {
              return {
                ...c,
                latestOffer: {
                  ...c.latestOffer!,
                  status: data.offer.status,
                },
              };
            }
            return c;
          })
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOfferActionLoading(false);
    }
  };

  const handleSaveResi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !shippingResi.trim() || shippingLoading) return;

    setShippingLoading(true);
    try {
      const res = await fetch(`/api/conversations/${selectedConvId}/shipping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-resi",
          courierName: shippingCourier,
          trackingNumber: shippingResi.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === selectedConvId) {
              return {
                ...c,
                courierName: data.conversation.courierName,
                trackingNumber: data.conversation.trackingNumber,
                shippingStatus: data.conversation.shippingStatus,
                shippedAt: data.conversation.shippedAt,
              };
            }
            return c;
          })
        );
        setIsEditingResi(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setShippingLoading(false);
    }
  };

  const handleToggleBlock = async (targetUserId: string, currentlyBlocked: boolean) => {
    const actionText = currentlyBlocked ? "membuka blokir" : "memblokir";
    if (!confirm(`Apakah Anda yakin ingin ${actionText} pembeli ini?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/users/${targetUserId}/block`, {
        method: "POST",
      });

      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === selectedConvId) {
              return {
                ...c,
                isBlockedByMe: !currentlyBlocked,
              };
            }
            return c;
          })
        );
      }
    } catch (err) {
      console.error("Block toggle error:", err);
    }
  };

  const handleMarkAsSold = async (productId: string) => {
    if (!confirm("Tandai pakaian ini sebagai TERJUAL (Sold Out)?")) return;
    try {
      const res = await fetch(`/api/products/${productId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SOLD" }),
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.productId === productId) {
              return {
                ...c,
                product: { ...c.product, status: "SOLD" },
              };
            }
            return c;
          })
        );
      }
    } catch (err) {
      console.error("Mark sold error:", err);
    }
  };

  const handleCopyResi = (resi: string) => {
    navigator.clipboard.writeText(resi);
    setCopiedResi(true);
    setTimeout(() => setCopiedResi(false), 2000);
  };

  // Filter conversations based on tab
  const filteredConversations = conversations.filter((c) => {
    if (filterTab === "PENDING_OFFER") {
      return c.latestOffer?.status === "PENDING";
    }
    if (filterTab === "NEED_SHIPPING") {
      return c.latestOffer?.status === "ACCEPTED" && !c.trackingNumber;
    }
    if (filterTab === "SHIPPED") {
      return !!c.trackingNumber;
    }
    return true;
  });

  const quickReplies = [
    "👋 Halo kak! Pakaian ini masih ready ya, silakan diorder.",
    "📏 Ukuran detail PxL dan kondisi baleran sudah lengkap di deskripsi kak.",
    "🚚 Pengiriman langsung kami proses hari ini via kurir ekspedisi.",
    "🤝 Mohon maaf kak, untuk item vintage langka ini harga sudah pas ya.",
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#131313] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#7A7A73]">Memuat Inbox Penjual Seken....</p>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-[#F2EADE] flex items-center justify-center mb-3 text-[#131313]">
          <IconStore className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-[#131313] mb-2">Akses Seller Centre Terbatas</h1>
        <p className="text-xs text-[#7A7A73] mb-6 max-w-sm">
          Silakan masuk terlebih dahulu untuk mengelola pesan dan tawaran dari calon pembeli.
        </p>
        <Link
          href="/auth/login?redirect=/seller/inbox"
          className="px-5 py-2.5 bg-[#131313] hover:bg-[#282828] text-white text-xs font-bold rounded-lg transition"
        >
          Masuk ke Akun
        </Link>
      </div>
    );
  }

  return (
    <SellerSidebarLayout user={currentUser}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {/* Page Header */}
        <div className="mb-6 pb-4 border-b border-[#E8E2D8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#131313] tracking-tight">
                Inbox Pesan & Tawaran Masuk
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F34431] text-white px-2 py-0.5 rounded">
                Toko Saya
              </span>
            </div>
            <p className="text-xs text-[#7A7A73] mt-1">
              Kelola pertanyaan calon pembeli, negosiasi harga tawaran baleran, dan kirim nomor resi pengiriman.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/inbox"
              className="text-xs font-semibold text-[#4A4A48] hover:text-[#131313] bg-white border border-[#E8E2D8] px-3.5 py-1.5 rounded-lg transition"
            >
              Lihat Chat Belanja (Buyer) →
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shrink-0 ${
              filterTab === "ALL"
                ? "bg-[#131313] text-white"
                : "bg-white text-[#4A4A48] border border-[#E8E2D8] hover:bg-[#FAF8F5]"
            }`}
          >
            Semua Pesan ({conversations.length})
          </button>
          <button
            onClick={() => setFilterTab("PENDING_OFFER")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
              filterTab === "PENDING_OFFER"
                ? "bg-[#F34431] text-white"
                : "bg-white text-[#4A4A48] border border-[#E8E2D8] hover:bg-[#FAF8F5]"
            }`}
          >
            <IconTag className="w-3.5 h-3.5" />
            <span>Tawaran Perlu Respon</span>
            {conversations.filter((c) => c.latestOffer?.status === "PENDING").length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
          <button
            onClick={() => setFilterTab("NEED_SHIPPING")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
              filterTab === "NEED_SHIPPING"
                ? "bg-[#131313] text-white"
                : "bg-white text-[#4A4A48] border border-[#E8E2D8] hover:bg-[#FAF8F5]"
            }`}
          >
            <IconTruck className="w-3.5 h-3.5" />
            <span>Perlu Input Resi</span>
          </button>
          <button
            onClick={() => setFilterTab("SHIPPED")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shrink-0 ${
              filterTab === "SHIPPED"
                ? "bg-[#131313] text-white"
                : "bg-white text-[#4A4A48] border border-[#E8E2D8] hover:bg-[#FAF8F5]"
            }`}
          >
            Sudah Dikirim
          </button>
        </div>

        {conversations.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#E8E2D8] px-4">
            <div className="w-12 h-12 bg-[#F2EADE] rounded-2xl flex items-center justify-center mx-auto text-[#131313] mb-3">
              <IconMessage className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[#131313] text-sm mb-1">
              Belum Ada Pesan Masuk dari Calon Pembeli
            </h3>
            <p className="text-xs text-[#7A7A73] max-w-sm mx-auto mb-5 leading-relaxed">
              Saat ada pembeli yang menanyakan detail pakaian atau menawar listing pakaian Anda, percakapan akan otomatis masuk ke sini.
            </p>
            <Link
              href="/sell"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#131313] hover:bg-[#282828] px-4 py-2.5 rounded-lg transition"
            >
              <IconPlus className="w-3.5 h-3.5" />
              <span>Tambah Listing Pakaian Baru</span>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8E2D8] overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[720px] shadow-sm">
            {/* Conversation List (Left Column) */}
            <div
              className={`md:col-span-4 border-r border-[#E8E2D8] flex flex-col h-full ${
                selectedConvId ? "hidden md:flex" : "flex"
              }`}
            >
              <div className="p-3 border-b border-[#E8E2D8] bg-[#FAF8F5] flex items-center justify-between text-xs font-bold text-[#131313]">
                <span>Daftar Calon Pembeli</span>
                <span className="text-[10px] bg-[#E8E2D8] text-[#131313] px-2 py-0.5 rounded-full font-mono">
                  {filteredConversations.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-[#F2EADE]/60">
                {filteredConversations.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#7A7A73]">
                    Tidak ada percakapan pada filter ini.
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isSelected = conv.id === selectedConvId;
                    const lastMsg = conv.messages[conv.messages.length - 1];
                    const productImg =
                      conv.product.images[0]?.imageUrl ||
                      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=200";

                    return (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => setSelectedConvId(conv.id)}
                        className={`w-full p-3.5 text-left flex items-start gap-3 transition cursor-pointer relative ${
                          isSelected ? "bg-[#F2EADE]" : "hover:bg-[#FAF8F5]"
                        }`}
                      >
                        {/* Product Thumbnail */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={productImg}
                          alt={conv.product.title}
                          className="w-12 h-12 rounded-lg object-cover shrink-0 border border-[#E8E2D8]"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="font-bold text-xs text-[#131313] truncate">
                              {conv.buyer.name}
                            </span>
                            <span className="text-[10px] text-[#7A7A73] shrink-0 font-mono">
                              {new Date(conv.updatedAt).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <p className="text-[11px] font-medium text-[#4A4A48] truncate mb-1">
                            {conv.product.title}
                          </p>

                          {/* Offer / Status Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {conv.latestOffer && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded leading-none ${
                                  conv.latestOffer.status === "PENDING"
                                    ? "bg-amber-100 text-amber-900 border border-amber-200"
                                    : conv.latestOffer.status === "ACCEPTED"
                                    ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                                    : "bg-rose-100 text-rose-900 border border-rose-200"
                                }`}
                              >
                                Tawaran: Rp {conv.latestOffer.offeredPrice.toLocaleString("id-ID")}
                              </span>
                            )}

                            {conv.trackingNumber && (
                              <span className="text-[10px] font-medium bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded leading-none flex items-center gap-0.5">
                                <IconTruck className="w-2.5 h-2.5" />
                                <span>{conv.courierName}</span>
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-[#7A7A73] truncate mt-1">
                            {lastMsg ? lastMsg.text : "Belum ada pesan"}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
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
                  <div className="p-3.5 bg-white border-b border-[#E8E2D8] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => setSelectedConvId(null)}
                        className="md:hidden p-1 text-[#7A7A73] hover:text-[#131313]"
                      >
                        ←
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h2 className="font-bold text-xs sm:text-sm text-[#131313] truncate">
                            {activeConv.buyer.name}
                          </h2>
                          <span className="text-[10px] font-bold bg-[#F2EADE] text-[#131313] px-2 py-0.5 rounded">
                            Calon Pembeli
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7A7A73] truncate">
                          Domisili: {activeConv.buyer.profile?.city || "Indonesia"} • Menanyakan: {activeConv.product.title}
                        </p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1.5">
                      {/* Mark Sold Button */}
                      {activeConv.product.status === "AVAILABLE" && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsSold(activeConv.product.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#131313] hover:bg-[#282828] text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          <IconCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="hidden sm:inline">Tandai Terjual</span>
                        </button>
                      )}

                      {/* WhatsApp Handshake Button */}
                      {activeConv.buyer.profile?.whatsappNumber && (
                        <a
                          href={`https://wa.me/${activeConv.buyer.profile.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                            `Halo ${activeConv.buyer.name}, ini dari ${currentUser?.name || "Penjual"} terkait pesanan pakaian "${activeConv.product.title}".`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#059669] hover:bg-[#047857] text-white rounded-lg text-xs font-bold transition"
                        >
                          <IconWhatsApp className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">WA</span>
                        </a>
                      )}

                      {/* Link to Product */}
                      <Link
                        href={`/products/${activeConv.product.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#F2EADE] hover:bg-[#E8E2D8] text-[#131313] rounded-lg text-xs font-semibold transition"
                      >
                        <span className="hidden sm:inline">Iklan</span> →
                      </Link>

                      {/* Block User Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleBlock(activeConv.buyerId, !!activeConv.isBlockedByMe)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer ${
                          activeConv.isBlockedByMe
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "text-[#575752] border-[#E8E2D8] hover:text-rose-600 hover:border-rose-200"
                        }`}
                        title={activeConv.isBlockedByMe ? "Buka Blokir Pembeli" : "Blokir Pembeli"}
                      >
                        <IconBan className="w-3.5 h-3.5 text-rose-500" />
                        <span className="hidden sm:inline">
                          {activeConv.isBlockedByMe ? "Buka Blokir" : "Blokir"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Seller Operational Tools (Offers & Shipping) */}
                  <div className="p-3 bg-white border-b border-[#E8E2D8] space-y-2.5">
                    {/* Offer Response Box */}
                    {activeConv.latestOffer && (
                      <div className="p-3 rounded-xl border border-[#E8E2D8] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#F2EADE] text-[#131313] flex items-center justify-center shrink-0">
                            <IconTag className="w-4 h-4 text-[#F34431]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#131313] tabular-nums">
                                Tawaran Masuk: Rp {activeConv.latestOffer.offeredPrice.toLocaleString("id-ID")}
                              </span>
                              <span className="text-xs text-[#7A7A73] line-through tabular-nums">
                                Rp {activeConv.product.price.toLocaleString("id-ID")}
                              </span>
                            </div>
                            <span
                              className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded ${
                                activeConv.latestOffer.status === "PENDING"
                                  ? "bg-amber-100 text-amber-900 border border-amber-200"
                                  : activeConv.latestOffer.status === "ACCEPTED"
                                  ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                                  : "bg-rose-100 text-rose-900 border border-rose-200"
                              }`}
                            >
                              {activeConv.latestOffer.status === "PENDING"
                                ? "Menunggu Persetujuan Anda"
                                : activeConv.latestOffer.status === "ACCEPTED"
                                ? "✓ Tawaran Disetujui"
                                : "Tawaran Ditolak"}
                            </span>
                          </div>
                        </div>

                        {/* Accept / Decline Action Buttons */}
                        {activeConv.latestOffer.status === "PENDING" && (
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <button
                              type="button"
                              disabled={offerActionLoading}
                              onClick={() => handleOfferResponse(activeConv.latestOffer!.id, "ACCEPTED")}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#059669] hover:bg-[#047857] text-white rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
                            >
                              <IconCheck className="w-3.5 h-3.5" />
                              <span>Terima Tawaran</span>
                            </button>
                            <button
                              type="button"
                              disabled={offerActionLoading}
                              onClick={() => handleOfferResponse(activeConv.latestOffer!.id, "DECLINED")}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                            >
                              <IconX className="w-3.5 h-3.5" />
                              <span>Tolak</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Shipping Tracking Number Input / Status */}
                    <div className="p-3 rounded-xl border border-[#E8E2D8] bg-[#FAF8F5]">
                      {activeConv.trackingNumber && !isEditingResi ? (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                              <IconTruck className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#131313]">
                                  {activeConv.courierName || "Kurir Ekspedisi"}
                                </span>
                                <span className="text-[10px] font-mono bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-bold">
                                  {activeConv.trackingNumber}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#7A7A73] mt-0.5">
                                Paket pakaian telah diserahkan ke kurir untuk dikirim ke pembeli. (Nomor resi berfungsi sebagai rujukan pelacakan kurir, bukan jaminan escrow).
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleCopyResi(activeConv.trackingNumber!)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold border border-[#E8E2D8] rounded-md hover:bg-white text-[#131313] transition cursor-pointer"
                            >
                              <IconCopy className="w-3 h-3 text-[#7A7A73]" />
                              <span>{copiedResi ? "Tersalin!" : "Salin Resi"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShippingCourier(activeConv.courierName || "J&T Express");
                                setShippingResi(activeConv.trackingNumber || "");
                                setIsEditingResi(true);
                              }}
                              className="text-[11px] text-[#F34431] hover:underline font-semibold cursor-pointer px-1"
                            >
                              Ubah Resi
                            </button>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleSaveResi} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="w-7 h-7 rounded-lg bg-[#F2EADE] text-[#131313] flex items-center justify-center shrink-0">
                              <IconTruck className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-bold text-[#131313]">
                              Kirim Nomor Resi:
                            </span>
                          </div>

                          <select
                            value={shippingCourier}
                            onChange={(e) => setShippingCourier(e.target.value)}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-[#E8E2D8] bg-white text-[#131313] focus:outline-none"
                          >
                            <option value="J&T Express">J&T Express</option>
                            <option value="SiCepat">SiCepat</option>
                            <option value="JNE Reguler">JNE Reguler</option>
                            <option value="POS Indonesia">POS Indonesia</option>
                            <option value="Anteraja">Anteraja</option>
                            <option value="GoSend / GrabExpress">GoSend / GrabExpress</option>
                            <option value="TIKI">TIKI</option>
                          </select>

                          <input
                            type="text"
                            required
                            placeholder="Nomor resi pengiriman pakaian..."
                            value={shippingResi}
                            onChange={(e) => setShippingResi(e.target.value)}
                            className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-[#E8E2D8] bg-white text-[#131313] focus:outline-none focus:border-[#131313]"
                          />

                          <div className="flex items-center gap-1.5">
                            <button
                              type="submit"
                              disabled={shippingLoading}
                              className="px-3 py-1.5 bg-[#131313] hover:bg-[#282828] text-white rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50 shrink-0"
                            >
                              {shippingLoading ? "Menyimpan..." : "Kirim Resi"}
                            </button>
                            {isEditingResi && (
                              <button
                                type="button"
                                onClick={() => setIsEditingResi(false)}
                                className="px-2.5 py-1.5 bg-white border border-[#E8E2D8] text-[#7A7A73] hover:text-[#131313] rounded-lg text-xs font-semibold transition cursor-pointer"
                              >
                                Batal
                              </button>
                            )}
                          </div>
                        </form>
                      )}
                    </div>

                    {/* Quick Reply Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1">
                      <span className="text-[10px] font-bold text-[#7A7A73] shrink-0 uppercase tracking-wider">
                        Balasan Cepat:
                      </span>
                      {quickReplies.map((reply, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(reply)}
                          className="shrink-0 text-[11px] bg-[#FAF8F5] hover:bg-[#F2EADE] text-[#4A4A48] border border-[#E8E2D8] px-2.5 py-1 rounded-full transition cursor-pointer font-medium"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message Thread */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {activeConv.messages.length === 0 ? (
                      <div className="text-center py-12 text-[#7A7A73] text-xs">
                        Belum ada riwayat pesan. Kirim pesan pertama untuk menyapa pembeli!
                      </div>
                    ) : (
                      activeConv.messages.map((msg) => {
                        const isMe = msg.senderId === currentUser?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs ${
                                isMe
                                  ? "bg-[#131313] text-[#FAF8F5] rounded-br-xs"
                                  : "bg-white text-[#131313] border border-[#E8E2D8] rounded-bl-xs shadow-xs"
                              }`}
                            >
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                              <span
                                className={`text-[9px] block text-right mt-1 font-mono ${
                                  isMe ? "text-[#E8E2D8]" : "text-[#7A7A73]"
                                }`}
                              >
                                {new Date(msg.createdAt).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input Box */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="p-3 bg-white border-t border-[#E8E2D8] flex items-center gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Ketik balasan untuk pembeli..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-[#E8E2D8] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:border-[#131313] text-[#131313] transition"
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="px-5 py-2.5 bg-[#131313] hover:bg-[#282828] text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      {sending ? "Mengirim..." : "Kirim"}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center p-8 text-[#7A7A73] text-xs">
                  Pilih percakapan dari daftar di sebelah kiri untuk melihat detail pesan.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SellerSidebarLayout>
  );
}
