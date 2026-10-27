"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { 
  IconSearch, 
  IconPlus, 
  IconMessage, 
  IconStore, 
  IconLogOut,
  IconBell,
  IconHeart,
  IconUsers,
  IconHelpCircle,
  IconArrowRight,
  IconTag
} from "@/components/Icons";

interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: string;
  activeMode?: "BUYER" | "SELLER";
  unreadNotifications?: number;
  favoritesCount?: number;
  followingCount?: number;
  profile?: {
    username: string;
    avatarUrl?: string | null;
    city?: string | null;
  } | null;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQ = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(currentQ);
  const [prevQ, setPrevQ] = useState(currentQ);

  if (currentQ !== prevQ) {
    setPrevQ(currentQ);
    setSearchQuery(currentQ);
  }

  const [user, setUser] = useState<SafeUser | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const notifRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ignore = false;

    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (ignore) return;
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setUnreadCount(data.user?.unreadNotifications || 0);
        } else {
          setUser(null);
        }
      } catch {
        if (!ignore) setUser(null);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    fetchUser();

    return () => {
      ignore = true;
    };
  }, []);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Fetch notifications error:", err);
    }
  };

  const handleToggleNotif = () => {
    if (!isNotifOpen) {
      fetchNotifications();
    }
    setIsNotifOpen(!isNotifOpen);
    setIsDropdownOpen(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH", body: JSON.stringify({}) });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      if (user) {
        setUser({ ...user, unreadNotifications: 0 });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: notif.id }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }
    setIsNotifOpen(false);
    if (notif.linkUrl) {
      router.push(notif.linkUrl);
    }
  };

  const handleSwitchMode = async (targetMode: "BUYER" | "SELLER") => {
    setIsSwitchingMode(true);
    try {
      const res = await fetch("/api/auth/mode", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: targetMode }),
      });
      if (res.ok) {
        setUser((prev) => (prev ? { ...prev, activeMode: targetMode } : null));
        setIsDropdownOpen(false);
        if (targetMode === "SELLER") {
          router.push("/seller/dashboard");
        } else {
          router.push("/");
        }
        router.refresh();
      }
    } catch (err) {
      console.error("Switch mode error:", err);
    } finally {
      setIsSwitchingMode(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setIsDropdownOpen(false);
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  // If on dedicated seller pages, hide top navbar because the left sidebar dashboard layout is rendered
  if (pathname.startsWith("/seller/dashboard") || pathname.startsWith("/seller/inbox") || pathname === "/my-listings" || pathname === "/sell" || pathname.includes("/edit")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E8E2D8] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center shrink-0 group py-1 transition-transform group-hover:scale-[1.01]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/seken-wordmark.png"
              alt="Seken."
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-2 hidden md:block">
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[#575752] pointer-events-none">
                <IconSearch className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari denim Kurabo, band tees 90s, vintage workwear..."
                className="w-full bg-[#F2EADE]/60 hover:bg-[#F2EADE]/90 focus:bg-white text-[#131313] pl-9 pr-10 py-1.5 rounded-lg border border-[#E8E2D8] focus:border-[#131313] focus:outline-none text-xs transition placeholder:text-[#7A7A73]"
              />
              <span className="absolute right-2.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#E8E2D8]/70 text-[#575752] pointer-events-none">
                /
              </span>
            </div>
          </form>

          {/* Toko Saya button (Switch Mode) */}
          {user && (
            <div className="hidden lg:flex items-center">
              <button
                onClick={() => handleSwitchMode("SELLER")}
                disabled={isSwitchingMode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F2EADE] hover:bg-[#E8E0D5] text-[#131313] border border-[#E8E2D8] transition active:scale-[0.98] cursor-pointer group"
                title="Buka Toko Saya & Masuk ke Dashboard Seller"
              >
                <IconStore className="w-3.5 h-3.5 text-[#131313] group-hover:text-[#F34431] transition-colors" />
                <span>{isSwitchingMode ? "Membuka Toko..." : "Toko Saya"}</span>
              </button>
            </div>
          )}

          {/* Clean Buyer Navigation Links (No compare menu in top right) */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-[#3D3D3A]">
            <Link
              href="/wishlist"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition relative ${
                pathname === "/wishlist" ? "bg-[#F2EADE] text-[#131313]" : "hover:bg-[#F2EADE]/60 hover:text-[#131313]"
              }`}
            >
              <IconHeart className="w-3.5 h-3.5 text-[#F34431]" />
              <span>Wishlist</span>
              {(user?.favoritesCount ?? 0) > 0 && (
                <span className="text-[10px] bg-[#131313] text-white px-1.5 py-0.2 rounded-full font-bold">
                  {user?.favoritesCount}
                </span>
              )}
            </Link>

            <Link
              href="/following"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition ${
                pathname === "/following" ? "bg-[#F2EADE] text-[#131313]" : "hover:bg-[#F2EADE]/60 hover:text-[#131313]"
              }`}
            >
              <IconUsers className="w-3.5 h-3.5 text-[#7A7A73]" />
              <span>Toko Diikuti</span>
              {(user?.followingCount ?? 0) > 0 && (
                <span className="text-[10px] bg-[#E8E2D8] text-[#131313] px-1.5 py-0.2 rounded-full font-bold">
                  {user?.followingCount}
                </span>
              )}
            </Link>

            <Link
              href="/help"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition ${
                pathname === "/help" ? "bg-[#F2EADE] text-[#131313]" : "hover:bg-[#F2EADE]/60 hover:text-[#131313]"
              }`}
            >
              <IconHelpCircle className="w-3.5 h-3.5 text-[#7A7A73]" />
              <span>Bantuan</span>
            </Link>
          </nav>

          {/* Action buttons & user profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Jual Pakaian Button */}
            <Link
              href={user ? "/sell" : "/auth/login?redirect=/sell"}
              className="flex items-center gap-1.5 bg-[#131313] hover:bg-[#262626] active:scale-[0.98] text-[#FAF8F5] font-semibold text-xs px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg transition duration-150 cursor-pointer border border-[#131313] shadow-xs group"
            >
              <IconPlus className="w-3.5 h-3.5 text-[#F34431] group-hover:rotate-90 transition-transform duration-200" />
              <span className="hidden sm:inline">Jual Pakaian</span>
              <span className="sm:hidden">Jual</span>
            </Link>

            {/* User State */}
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-[#E8E2D8] animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-1 sm:gap-1.5">
                {/* Inbox Chat Link */}
                <Link
                  href="/inbox"
                  className={`p-2 text-[#3D3D3A] hover:text-[#131313] hover:bg-[#F2EADE] rounded-lg transition relative ${
                    pathname === "/inbox" ? "bg-[#F2EADE] text-[#131313]" : ""
                  }`}
                  title="Pesan & Negosiasi"
                >
                  <IconMessage className="w-4 h-4" />
                </Link>

                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={handleToggleNotif}
                    className="p-2 text-[#3D3D3A] hover:text-[#131313] hover:bg-[#F2EADE] rounded-lg transition relative cursor-pointer"
                    title="Notifikasi"
                  >
                    <IconBell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F34431] ring-2 ring-[#FAF8F5]" />
                    )}
                  </button>

                  {/* Notification Popover */}
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-[#E8E2D8] py-2 z-50">
                      <div className="px-4 py-2 border-b border-[#F2EADE] flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-[#131313]">Pusat Notifikasi</h4>
                          <p className="text-[10px] text-[#7A7A73]">Aktivitas tawaran, pesan, dan pesanan</p>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[11px] text-[#F34431] hover:underline font-semibold cursor-pointer"
                          >
                            Tandai semua dibaca
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-[#F2EADE]/60">
                        {notifications.length === 0 ? (
                          <div className="py-8 px-4 text-center">
                            <IconBell className="w-6 h-6 text-[#A8A8A0] mx-auto mb-2" />
                            <p className="text-xs font-semibold text-[#131313]">Belum ada notifikasi baru</p>
                            <p className="text-[11px] text-[#7A7A73] mt-0.5">Tawaran masuk dan kabar pesanan akan muncul di sini.</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`p-3 text-xs cursor-pointer hover:bg-[#FAF8F5] transition flex items-start gap-2.5 ${
                                !notif.isRead ? "bg-[#FDF9F3]" : ""
                              }`}
                            >
                              <div className="p-1.5 rounded-md bg-[#F2EADE] text-[#131313] shrink-0 mt-0.5">
                                {notif.type === "OFFER" ? (
                                  <IconTag className="w-3.5 h-3.5 text-[#F34431]" />
                                ) : notif.type === "FOLLOW" ? (
                                  <IconUsers className="w-3.5 h-3.5 text-[#131313]" />
                                ) : (
                                  <IconMessage className="w-3.5 h-3.5 text-[#131313]" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-[#131313] leading-tight text-xs flex items-center justify-between">
                                  <span className="truncate">{notif.title}</span>
                                  {!notif.isRead && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#F34431] shrink-0 ml-1" />
                                  )}
                                </p>
                                <p className="text-[#575752] text-[11px] mt-0.5 line-clamp-2">{notif.message}</p>
                                <span className="text-[10px] text-[#A8A8A0] mt-1 block">
                                  {new Date(notif.createdAt).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="p-2 border-t border-[#F2EADE] bg-[#FAF8F5] text-center">
                        <Link
                          href="/inbox"
                          onClick={() => setIsNotifOpen(false)}
                          className="text-[11px] font-semibold text-[#131313] hover:text-[#F34431] transition inline-flex items-center gap-1"
                        >
                          <span>Buka Kotak Masuk Tawaran & Pesan</span>
                          <IconArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown (Clean Separation between Buyer & Seller!) */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(!isDropdownOpen);
                      setIsNotifOpen(false);
                    }}
                    className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-[#F2EADE] transition border border-[#E8E2D8] cursor-pointer"
                  >
                    {user.profile?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.profile.avatarUrl}
                        alt={user.name}
                        className="w-6 h-6 rounded-md object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-md bg-[#131313] text-[#FAF8F5] flex items-center justify-center font-bold text-[11px]">
                        {user.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-[#131313] hidden sm:block max-w-[90px] truncate">
                      {user.name}
                    </span>
                  </button>

                  {/* Dropdown Menu: STRICT SEPARATION */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-[#E8E2D8] py-1.5 z-50">
                      <div className="px-3.5 py-2.5 border-b border-[#F2EADE]">
                        <p className="text-xs font-bold text-[#131313] truncate">{user.name}</p>
                        <p className="text-xs text-[#575752] truncate">@{user.profile?.username || user.email}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px] text-[#7A7A73]">Status Akun:</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F2EADE] text-[#131313]">
                            Mode Pembeli
                          </span>
                        </div>
                      </div>

                      {/* Switch to Seller Action */}
                      <div className="p-2 border-b border-[#F2EADE] bg-[#FAF8F5]/60">
                        <button
                          onClick={() => handleSwitchMode("SELLER")}
                          disabled={isSwitchingMode}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-semibold bg-[#131313] text-white hover:bg-[#262626] transition cursor-pointer"
                        >
                          <span>Buka Toko Saya</span>
                          <span className="text-[10px] text-[#F34431]">Masuk Dashboard →</span>
                        </button>
                      </div>

                      {/* Buyer-ONLY links */}
                      <div className="py-1">
                        <Link
                          href="/wishlist"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center justify-between px-3.5 py-2 text-xs text-[#3D3D3A] hover:text-[#131313] hover:bg-[#FAF8F5] font-medium transition"
                        >
                          <span className="flex items-center gap-2">
                            <IconHeart className="w-4 h-4 text-[#F34431]" />
                            <span>Wishlist / Disukai</span>
                          </span>
                          {(user.favoritesCount ?? 0) > 0 && (
                            <span className="text-[10px] bg-[#F2EADE] px-1.5 py-0.5 rounded font-bold text-[#131313]">
                              {user.favoritesCount}
                            </span>
                          )}
                        </Link>

                        <Link
                          href="/following"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2 text-xs text-[#3D3D3A] hover:text-[#131313] hover:bg-[#FAF8F5] font-medium transition"
                        >
                          <IconUsers className="w-4 h-4 text-[#7A7A73]" />
                          <span>Toko Thrift Diikuti</span>
                        </Link>

                        <Link
                          href="/help"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2 text-xs text-[#3D3D3A] hover:text-[#131313] hover:bg-[#FAF8F5] font-medium transition"
                        >
                          <IconHelpCircle className="w-4 h-4 text-[#7A7A73]" />
                          <span>Pusat Bantuan & Panduan</span>
                        </Link>
                      </div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#F34431] hover:bg-[#FDF2F0] font-medium transition border-t border-[#F2EADE] text-left cursor-pointer"
                      >
                        <IconLogOut className="w-4 h-4" />
                        <span>Keluar (Logout)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/auth/login"
                  className="text-xs font-semibold text-[#3D3D3A] hover:text-[#131313] px-2.5 py-1.5 transition"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/register"
                  className="text-xs font-semibold bg-[#131313] hover:bg-[#262626] active:scale-[0.98] text-[#FAF8F5] px-3.5 py-1.5 rounded-lg transition border border-[#131313]"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex lg:hidden items-center justify-between py-2 border-t border-[#E8E2D8] text-[11px] font-semibold text-[#575752] overflow-x-auto gap-3">
          {user && (
            <button
              onClick={() => handleSwitchMode("SELLER")}
              disabled={isSwitchingMode}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md shrink-0 cursor-pointer bg-[#F2EADE] text-[#131313]"
            >
              <IconStore className="w-3 h-3 text-[#F34431]" />
              <span>Buka Toko Saya</span>
            </button>
          )}

          <Link
            href="/wishlist"
            className={`flex items-center gap-1 shrink-0 ${pathname === "/wishlist" ? "text-[#131313] font-bold" : ""}`}
          >
            <IconHeart className="w-3 h-3 text-[#F34431]" />
            <span>Wishlist</span>
          </Link>
          <Link
            href="/following"
            className={`flex items-center gap-1 shrink-0 ${pathname === "/following" ? "text-[#131313] font-bold" : ""}`}
          >
            <IconUsers className="w-3 h-3 text-[#7A7A73]" />
            <span>Toko Diikuti</span>
          </Link>
          <Link
            href="/help"
            className={`flex items-center gap-1 shrink-0 ${pathname === "/help" ? "text-[#131313] font-bold" : ""}`}
          >
            <IconHelpCircle className="w-3 h-3 text-[#7A7A73]" />
            <span>Bantuan</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
