"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  IconStore, 
  IconAlert, 
  IconArrowRight 
} from "@/components/Icons";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal masuk");
      }

      router.push(redirectUrl);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan teknis");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-xl border border-[#E8E2D8] p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-[#131313] tracking-tight">
            Masuk ke Akun
          </h1>
          <p className="text-xs text-[#4A4A48] mt-1.5">
            Akses etalase pakaian thrift vintage dan negosiasi penawaran Anda
          </p>
        </div>

        {/* Quick Demo Logins */}
        <div className="mb-6 bg-[#FAF8F5] border border-[#E8E2D8] rounded-lg p-3">
          <p className="text-xs font-semibold text-[#7E7E77] mb-2 text-center">
            Pilih Akun Demo:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("seller@thrift.com")}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-[#F2EADE] border border-[#E8E2D8] rounded-lg text-xs font-semibold text-[#131313] transition cursor-pointer"
            >
              <IconStore className="w-3.5 h-3.5 text-[#F34431]" />
              <span>Demo Penjual</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("buyer@thrift.com")}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-[#F2EADE] border border-[#E8E2D8] rounded-lg text-xs font-semibold text-[#131313] transition cursor-pointer"
            >
              <span className="text-blue-600 font-bold">@</span>
              <span>Demo Pembeli</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <IconAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#4A4A48] mb-1.5">
              Alamat Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full px-3.5 py-2 rounded-lg border border-[#E4E4DC] focus:border-[#131313] focus:outline-none text-xs text-[#131313] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4A4A48] mb-1.5">
              Kata Sandi
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-lg border border-[#E4E4DC] focus:border-[#131313] focus:outline-none text-xs text-[#131313] transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-[#131313] hover:bg-[#282828] text-white font-bold py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <IconArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#7E7E77]">
          Belum memiliki akun?{" "}
          <Link href="/auth/register" className="font-bold text-[#131313] hover:text-[#F34431] transition">
            Daftar Gratis
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-20 text-center text-[#7E7E77] text-xs">Memuat form login...</div>}>
      <LoginForm />
    </Suspense>
  );
}
