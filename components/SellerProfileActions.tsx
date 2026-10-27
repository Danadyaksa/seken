"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconWhatsApp, IconUsers, IconCheck, IconBan } from "@/components/Icons";

interface SellerProfileActionsProps {
  sellerId: string;
  sellerName: string;
  whatsappNumber?: string | null;
  initialFollowersCount?: number;
}

export default function SellerProfileActions({
  sellerId,
  sellerName,
  whatsappNumber,
  initialFollowersCount = 0,
}: SellerProfileActionsProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function fetchInitialStatus() {
      try {
        // Get current user
        const meRes = await fetch("/api/auth/me");
        if (ignore) return;
        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUserId(meData.user?.id || null);
        }

        // Check follow status
        const followRes = await fetch(`/api/users/${sellerId}/follow`);
        if (ignore) return;
        if (followRes.ok) {
          const data = await followRes.json();
          setIsFollowing(data.isFollowing);
          setFollowersCount(data.followersCount);
        }

        // Check block status
        const blockRes = await fetch(`/api/users/${sellerId}/block`);
        if (ignore) return;
        if (blockRes.ok) {
          const blockData = await blockRes.json();
          setIsBlocked(blockData.isBlocked);
        }
      } catch (err) {
        console.error(err);
      }
    }

    fetchInitialStatus();

    return () => {
      ignore = true;
    };
  }, [sellerId]);

  const handleToggleFollow = async () => {
    if (!currentUserId) {
      router.push(`/auth/login?redirect=/seller/${sellerId}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${sellerId}/follow`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
        setFollowersCount((prev) => (data.isFollowing ? prev + 1 : Math.max(0, prev - 1)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!currentUserId) {
      router.push(`/auth/login?redirect=/seller/${sellerId}`);
      return;
    }

    const actionText = isBlocked ? "membuka blokir" : "memblokir";
    if (!confirm(`Apakah Anda yakin ingin ${actionText} toko/penjual ${sellerName}?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${sellerId}/block`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setIsBlocked(data.isBlocked);
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isSelf = currentUserId === sellerId;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Followers Counter Badge */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold text-[#131313]">
        <IconUsers className="w-3.5 h-3.5 text-[#7A7A73]" />
        <span>{followersCount} Pengikut</span>
      </div>

      {/* Follow Button (if not self) */}
      {!isSelf && (
        <button
          type="button"
          onClick={handleToggleFollow}
          disabled={loading}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-98 border ${
            isFollowing
              ? "bg-[#F2EADE] hover:bg-[#E8E0D5] text-[#131313] border-[#E8E2D8]"
              : "bg-[#131313] hover:bg-[#262626] text-white border-[#131313]"
          }`}
        >
          {isFollowing ? (
            <>
              <IconCheck className="w-3.5 h-3.5 text-[#131313]" />
              <span>Mengikuti</span>
            </>
          ) : (
            <>
              <IconUsers className="w-3.5 h-3.5 text-[#F34431]" />
              <span>Ikuti Toko</span>
            </>
          )}
        </button>
      )}

      {/* WhatsApp Button */}
      {whatsappNumber && (
        <a
          href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 rounded-lg bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <IconWhatsApp className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </a>
      )}

      {/* Block/Unblock Button (if not self) */}
      {!isSelf && (
        <button
          type="button"
          onClick={handleToggleBlock}
          disabled={loading}
          title={isBlocked ? "Buka Blokir Toko Ini" : "Blokir Toko Ini"}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition border cursor-pointer ${
            isBlocked
              ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
              : "text-[#7A7A73] border-[#E8E2D8] hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50"
          }`}
        >
          <IconBan className="w-3.5 h-3.5 text-rose-500" />
        </button>
      )}
    </div>
  );
}
