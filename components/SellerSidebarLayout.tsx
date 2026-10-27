"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  IconBarChart, 
  IconPackage, 
  IconPlus, 
  IconMessage, 
  IconStore, 
  IconHelpCircle, 
  IconLogOut, 
  IconBell, 
  IconTag, 
  IconUsers,
  IconArrowRight
} from "@/components/Icons";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: string;
  activeMode?: "BUYER" | "SELLER" | string;
  unreadNotifications?: number;
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

export default function SellerSidebarLayout({
  children,
  user,
}: {
  children: React.ReactNode;
  user: SafeUser | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(user?.unreadNotifications || 0);
  const [isSwitching, setIsSwitching] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
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
      console.error(err);
    }
  };

  const handleToggleNotif = () => {
    if (!isNotifOpen) {
      fetchNotifications();
    }
    setIsNotifOpen(!isNotifOpen);
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH", body: JSON.stringify({}) });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
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

  const handleSwitchToBuyer = async () => {
    setIsSwitching(true);
    try {
      const res = await fetch("/api/auth/mode", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "BUYER" }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error("Switch to buyer error:", err);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    {
      label: "Dashboard & Statistik",
      href: "/seller/dashboard",
      icon: IconBarChart,
      active: pathname === "/seller/dashboard",
    },
    {
      label: "Kelola Listing Pakaian",
      href: "/my-listings",
      icon: IconPackage,
      active: pathname === "/my-listings",
    },
    {
      label: "Jual Pakaian Baru",
      href: "/sell",
      icon: IconPlus,
      active: pathname === "/sell",
    },
    {
      label: "Inbox Tawaran & Pesan",
      href: "/seller/inbox",
      icon: IconMessage,
      active: pathname === "/seller/inbox",
    },
    {
      label: "Etalase Publik Toko",
      href: user ? `/seller/${user.profile?.username || user.id}` : "/seller/dashboard",
      icon: IconStore,
      active: pathname.startsWith("/seller/") && pathname !== "/seller/dashboard",
    },
    {
      label: "Pusat Bantuan Penjual",
      href: "/help",
      icon: IconHelpCircle,
      active: pathname === "/help",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col md:flex-row text-[#131313]">
      {/* Mobile Header Bar */}
      <div className="md:hidden sticky top-0 z-40 bg-[#131313] text-white px-4 py-3 flex items-center justify-between border-b border-[#262626]">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/seken-wordmark.png" alt="Seken." className="h-6 w-auto brightness-200 invert" />
          <span className="text-[10px] font-mono uppercase bg-[#F34431] text-white px-1.5 py-0.5 rounded font-bold">
            Toko Saya
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSwitchToBuyer}
            className="text-[11px] text-[#F2EADE] hover:underline font-medium cursor-pointer"
          >
            Mode Belanja →
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Left Sidebar (Desktop Fixed, Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#131313] text-[#FAF8F5] flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-[#262626] flex items-center justify-between">
            <Link href="/seller/dashboard" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/seken-wordmark.png"
                alt="Seken."
                className="h-7 w-auto object-contain brightness-200 invert"
              />
              <span className="text-[10px] font-mono tracking-wider bg-[#F2EADE] text-[#131313] font-black px-1.5 py-0.5 rounded">
                SELLER
              </span>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-white/70 hover:text-white p-1"
            >
              ✕
            </button>
          </div>

          {/* Active Toko Profile Card */}
          <div className="p-4 mx-3 my-3 bg-[#1C1C1C] rounded-xl border border-[#2B2B2B]">
            <div className="flex items-center gap-3">
              {user?.profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profile.avatarUrl}
                  alt={user.name}
                  className="w-10 h-10 rounded-lg object-cover border border-white/10"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-[#F2EADE] text-[#131313] font-bold flex items-center justify-center text-sm">
                  {user?.name ? user.name.charAt(0) : "T"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-white truncate">{user?.name || "Toko Penjual"}</p>
                <p className="text-[11px] text-[#A8A8A0] truncate">@{user?.profile?.username || user?.email || "penjual"}</p>
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Toko Aktif</span>
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Items (Seller Only!) */}
          <nav className="px-3 space-y-1">
            <span className="px-3 text-[10px] font-mono tracking-wider uppercase text-[#73736C] font-semibold block mb-1">
              Menu Toko
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    item.active
                      ? "bg-[#FAF8F5] text-[#131313] shadow-xs"
                      : "text-[#A8A8A0] hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.active ? "text-[#F34431]" : "text-[#73736C]"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Switch to Buyer Mode & Logout */}
        <div className="p-4 border-t border-[#262626] space-y-2">
          {/* Switch to Buyer Mode Button */}
          <button
            onClick={handleSwitchToBuyer}
            disabled={isSwitching}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#F2EADE] text-[#131313] hover:bg-white text-xs font-bold transition active:scale-[0.98] cursor-pointer group shadow-xs"
            title="Kembali ke Mode Belanja Pakaian Thrift"
          >
            <span className="flex items-center gap-2">
              <span className="text-sm">🛍️</span>
              <span>Beralih ke Belanja</span>
            </span>
            <span className="text-[10px] text-[#575752] group-hover:text-[#131313]">Mode Buyer →</span>
          </button>

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-xl transition text-left cursor-pointer"
          >
            <IconLogOut className="w-4 h-4" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar for Seller Dashboard */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E8E2D8] px-6 py-3.5 hidden md:flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#73736C]">Portal Toko</span>
            <span className="text-xs text-[#A8A8A0]">/</span>
            <span className="text-xs font-bold text-[#131313]">
              {navItems.find((i) => i.active)?.label || "Dashboard"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Action: + Jual Pakaian */}
            <Link
              href="/sell"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#131313] hover:bg-[#F34431] text-white text-xs font-bold transition cursor-pointer shadow-xs"
            >
              <IconPlus className="w-3.5 h-3.5" />
              <span>+ Listing Baru</span>
            </Link>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={handleToggleNotif}
                className="p-2 rounded-lg text-[#575752] hover:text-[#131313] hover:bg-[#F2EADE] transition relative cursor-pointer"
                title="Notifikasi Toko"
              >
                <IconBell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F34431] ring-2 ring-white" />
                )}
              </button>

              {/* Notification Popover */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-[#E8E2D8] py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#F2EADE] flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#131313]">Pusat Notifikasi Toko</h4>
                      <p className="text-[10px] text-[#7A7A73]">Aktivitas tawaran masuk dan pesanan</p>
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
                        <p className="text-[11px] text-[#7A7A73] mt-0.5">Tawaran masuk pembeli akan muncul di sini.</p>
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

            {/* Toko Avatar pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#E8E2D8]">
              {user?.profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profile.avatarUrl}
                  alt={user.name}
                  className="w-7 h-7 rounded-md object-cover border border-[#E8E2D8]"
                />
              ) : (
                <div className="w-7 h-7 rounded-md bg-[#131313] text-[#FAF8F5] flex items-center justify-center font-bold text-xs">
                  {user?.name ? user.name.charAt(0) : "T"}
                </div>
              )}
              <span className="text-xs font-bold text-[#131313]">{user?.name || "Penjual"}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
