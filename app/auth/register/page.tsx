"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconAlert, IconArrowRight } from "@/components/Icons";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    whatsappNumber: "",
    city: "Bandung",
    role: "BUYER" as "BUYER" | "SELLER",
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal melakukan registrasi");
      }

      router.push(data.redirectUrl || (formData.role === "SELLER" ? "/seller/dashboard" : "/"));
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan sistem");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-xl border border-[#E8E2D8] p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-[#131313] tracking-tight">
            Daftar Akun Baru
          </h1>
          <p className="text-xs text-[#4A4A48] mt-1.5">
            Mulai jual pakaian vintage impor atau tawar pakaian thrift favorit Anda
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <IconAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Primary Goal Selector (Buyer vs Seller) */}
          <div>
            <label className="block text-xs font-bold text-[#131313] mb-2">
              Pilih Tujuan Utama Pendaftaran:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "BUYER" })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  formData.role === "BUYER"
                    ? "border-[#131313] bg-[#131313] text-white shadow-sm"
                    : "border-[#E8E2D8] bg-[#FAF8F5] text-[#131313] hover:border-[#131313]/50"
                }`}
              >
                <div className="text-base mb-1">🛍️</div>
                <div className="text-xs font-bold">Belanja Thrift</div>
                <div className={`text-[10px] mt-0.5 leading-tight ${formData.role === "BUYER" ? "text-[#E8E2D8]" : "text-[#7A7A73]"}`}>
                  Cari pakaian vintage & tawar harga
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "SELLER" })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  formData.role === "SELLER"
                    ? "border-[#F34431] bg-[#F34431] text-white shadow-sm"
                    : "border-[#E8E2D8] bg-[#FAF8F5] text-[#131313] hover:border-[#F34431]/50"
                }`}
              >
                <div className="text-base mb-1">🏪</div>
                <div className="text-xs font-bold">Buka Toko Thrift</div>
                <div className={`text-[10px] mt-0.5 leading-tight ${formData.role === "SELLER" ? "text-white/90" : "text-[#7A7A73]"}`}>
                  Jual koleksi baleran impor
                </div>
              </button>
            </div>
            <p className="text-[10px] text-[#7A7A73] mt-1.5 italic">
              *1 akun untuk semua. Anda tetap bebas beralih belanja dan jualan kapan saja tanpa perlu buat akun baru.
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#4A4A48] mb-1.5">
              Nama Lengkap:
            </label>
            <input
              type="text"
              required
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Contoh: Tokyo Thrift Bandung"
              className="w-full px-3.5 py-2 rounded-lg border border-[#E4E4DC] focus:border-[#131313] focus:outline-none text-xs text-[#131313] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4A4A48] mb-1.5">
              Username Unik (Tanpa Spasi):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7E7E77] text-xs font-bold">@</span>
              <input
                type="text"
                required
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="tokyothrift"
                className="w-full pl-7 pr-3.5 py-2 rounded-lg border border-[#E4E4DC] focus:border-[#131313] focus:outline-none text-xs text-[#131313] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4A4A48] mb-1.5">
              Alamat Email:
            </label>
            <input
              type="email"
              required
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="nama@email.com"
              className="w-full px-3.5 py-2 rounded-lg border border-[#E4E4DC] focus:border-[#131313] focus:outline-none text-xs text-[#131313] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4A4A48] mb-1.5">
              Kata Sandi (Minimal 6 Karakter):
            </label>
            <input
              type="password"
              required
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-lg border border-[#E4E4DC] focus:border-[#131313] focus:outline-none text-xs text-[#131313] transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4A4A48] mb-1.5">
                Nomor WhatsApp (Handshake C2C):
              </label>
              <input
                type="text"
                required
                name="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={handleChange}
                placeholder="08123456789"
                className="w-full px-3.5 py-2 rounded-lg border border-[#E4E4DC] focus:border-[#131313] focus:outline-none text-xs text-[#131313] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A4A48] mb-1.5">
                Kota Domisili:
              </label>
              <input
                type="text"
                required
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Bandung"
                className="w-full px-3.5 py-2 rounded-lg border border-[#E4E4DC] focus:border-[#131313] focus:outline-none text-xs text-[#131313] transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-[#131313] hover:bg-[#282828] text-white font-bold py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span>Mendaftarkan Akun...</span>
            ) : (
              <>
                <span>Daftar Sekarang</span>
                <IconArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#7E7E77]">
          Sudah memiliki akun?{" "}
          <Link href="/auth/login" className="font-bold text-[#131313] hover:text-[#F34431] transition">
            Masuk ke Akun
          </Link>
        </div>
      </div>
    </div>
  );
}
