"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on dedicated seller dashboard pages
  if (pathname.startsWith("/seller/dashboard") || pathname.startsWith("/seller/inbox") || pathname === "/my-listings" || pathname === "/sell" || pathname.includes("/edit")) {
    return null;
  }

  return (
    <footer className="mt-auto bg-[#131313] text-[#A8A8A0] text-xs border-t border-[#262626]">
      {/* Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[#222222]">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/seken-wordmark.png"
                alt="Seken."
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-[#888882] max-w-sm leading-relaxed">
              Marketplace pakaian thrift vintage kurasi baleran impor internasional (Jepang, Thailand, USA, China). Transparansi kondisi pakaian,
              dimensi riil PxL (cm), dan transaksi langsung antar pembeli & penjual.
            </p>
          </div>

          {/* Links Column: Baleran */}
          <div className="md:col-span-3">
            <h5 className="font-bold text-white text-xs mb-3">
              Asal Baleran Impor
            </h5>
            <ul className="space-y-2 text-xs text-[#888882]">
              <li><Link href="/?country=JP" className="hover:text-white transition flex items-center gap-2"><span className="text-[10px] font-bold text-[#F2EADE] bg-white/10 px-1 py-0.5 rounded">JP</span><span>Baleran Jepang (Selvedge & Streetwear)</span></Link></li>
              <li><Link href="/?country=TH" className="hover:text-white transition flex items-center gap-2"><span className="text-[10px] font-bold text-[#F2EADE] bg-white/10 px-1 py-0.5 rounded">TH</span><span>Baleran Thailand (Band Tees & Faded)</span></Link></li>
              <li><Link href="/?country=US" className="hover:text-white transition flex items-center gap-2"><span className="text-[10px] font-bold text-[#F2EADE] bg-white/10 px-1 py-0.5 rounded">US</span><span>Baleran USA (Workwear & Flannel)</span></Link></li>
              <li><Link href="/?country=CN" className="hover:text-white transition flex items-center gap-2"><span className="text-[10px] font-bold text-[#F2EADE] bg-white/10 px-1 py-0.5 rounded">CN</span><span>Baleran China (Oversized & Windbreaker)</span></Link></li>
              <li><Link href="/?country=ID" className="hover:text-white transition flex items-center gap-2"><span className="text-[10px] font-bold text-[#F2EADE] bg-white/10 px-1 py-0.5 rounded">ID</span><span>Koleksi Thrift Lokal Indonesia</span></Link></li>
            </ul>
          </div>

          {/* Links Column: Kategori */}
          <div className="md:col-span-2">
            <h5 className="font-bold text-white text-xs mb-3">
              Kategori
            </h5>
            <ul className="space-y-2 text-xs text-[#888882]">
              <li><Link href="/?category=jaket-vintage" className="hover:text-white transition">Jaket & Outer</Link></li>
              <li><Link href="/?category=band-tees" className="hover:text-white transition">Band Tees</Link></li>
              <li><Link href="/?category=denim" className="hover:text-white transition">Denim Jeans</Link></li>
              <li><Link href="/?category=crewneck-hoodie" className="hover:text-white transition">Crewneck</Link></li>
              <li><Link href="/?category=flanel-workwear" className="hover:text-white transition">Workwear</Link></li>
            </ul>
          </div>

          {/* Info Column */}
          <div className="md:col-span-2">
            <h5 className="font-bold text-white text-xs mb-3">
              Transaksi
            </h5>
            <p className="text-[11px] text-[#71716A] leading-relaxed">
              Bebas biaya admin perantara. Kesepakatan harga langsung dilanjutkan via WhatsApp atau COD di lokasi.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[#666660] text-[11px]">
          <p>© 2026 Seken. (Seken Archive). Platform Kurasi Pakaian Thrift C2C.</p>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F34431]"></span>
            <span>Ink Black · Vintage Cream · Signal Red</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
