"use client";

import { useState } from "react";
import { 
  IconShieldCheck, 
  IconAlert, 
  IconCopy 
} from "@/components/Icons";

export default function HelpCenterPage() {
  const [activeTab, setActiveTab] = useState<"GUIDE" | "FAQ" | "REPORT">("GUIDE");
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    email: "",
    category: "TRANSACTION",
    message: "",
  });

  const supportEmail = "bantuan@seken.id";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReportSubmitted(true);
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[75vh] space-y-8">
      {/* Header */}
      <div className="border-b border-[#E8E2D8] pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-[#F34431] uppercase tracking-wider mb-1 font-bold">
          <span>PUSAT BANTUAN & LAPORAN</span>
          <span>·</span>
          <span>SEKEN ARCHIVE CARE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#131313] tracking-tight">
          Pusat Bantuan & Panduan Kolektor
        </h1>
        <p className="text-xs sm:text-sm text-[#575752] mt-1 max-w-2xl">
          Temukan panduan transaksi P2P tanpa biaya admin, transparansi ukuran riil PxL, serta kontak pelaporan kendala.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8E2D8] pb-1 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("GUIDE")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap ${
            activeTab === "GUIDE"
              ? "bg-[#131313] text-[#FAF8F5] shadow-xs"
              : "text-[#575752] hover:text-[#131313] hover:bg-[#F2EADE]/60"
          }`}
        >
          Panduan Transaksi P2P (0% Fee)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("FAQ")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap ${
            activeTab === "FAQ"
              ? "bg-[#131313] text-[#FAF8F5] shadow-xs"
              : "text-[#575752] hover:text-[#131313] hover:bg-[#F2EADE]/60"
          }`}
        >
          FAQ & Pertanyaan Umum
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("REPORT")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap ${
            activeTab === "REPORT"
              ? "bg-[#131313] text-[#FAF8F5] shadow-xs"
              : "text-[#575752] hover:text-[#131313] hover:bg-[#F2EADE]/60"
          }`}
        >
          Laporkan Kendala / Kontak Support
        </button>
      </div>

      {/* TAB 1: GUIDE */}
      {activeTab === "GUIDE" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F2EADE] text-[#131313] flex items-center justify-center font-bold font-mono text-xs">
                01
              </div>
              <h3 className="font-bold text-sm text-[#131313]">Cari & Inspeksi Ukuran</h3>
              <p className="text-xs text-[#575752] leading-relaxed">
                Pilih pakaian vintage impian Anda. Pastikan selalu memeriksa transparansi ukuran riil **Panjang × Lebar dada (cm)** agar pas di badan tanpa salah perkiraan ukuran tag luar negeri.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F2EADE] text-[#131313] flex items-center justify-center font-bold font-mono text-xs">
                02
              </div>
              <h3 className="font-bold text-sm text-[#131313]">Tawar Harga / Chat Direct</h3>
              <p className="text-xs text-[#575752] leading-relaxed">
                Gunakan tombol **Tawar Harga** untuk negosiasi harga wajar atau tekan **Chat Penjual / WhatsApp** untuk mendiskusikan ketersediaan, foto detail minus, dan kesepakatan pembayaran.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F2EADE] text-[#131313] flex items-center justify-center font-bold font-mono text-xs">
                03
              </div>
              <h3 className="font-bold text-sm text-[#131313]">COD atau Ekspedisi Kurir</h3>
              <p className="text-xs text-[#575752] leading-relaxed">
                Tentukan opsi COD (bertemu di tempat publik ramai) atau pengiriman via ekspedisi terpercaya (J&T, JNE, SiCepat). Penjual dapat memasukkan nomor resi resmi langsung di panel chat.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F2EADE]/60 border border-[#E8E2D8] text-xs text-[#3D3D3A] flex items-center gap-3">
            <IconShieldCheck className="w-5 h-5 text-[#059669] shrink-0" />
            <span>
              <strong>Bebas Biaya Admin 0%:</strong> Seken. tidak memotong komisi transaksi dari penjual maupun pembeli. Uang hasil penjualan 100% milik kolektor.
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: FAQ */}
      {activeTab === "FAQ" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1.5">
            <h3 className="font-bold text-sm text-[#131313]">Bagaimana cara beralih dari Mode Pembeli ke Mode Penjual?</h3>
            <p className="text-xs text-[#575752] leading-relaxed">
              Di navbar atas, cukup klik tombol <strong>&quot;Toko Saya&quot;</strong>. Anda akan langsung beralih ke Mode Penjual lengkap dengan Dashboard Statistik, menu pasang iklan (+ Jual Pakaian), dan pengelolaan stok pakaian di Inventaris Saya.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1.5">
            <h3 className="font-bold text-sm text-[#131313]">Apa arti indikator skor kondisi pemakaian (misal 9/10 Like New)?</h3>
            <p className="text-xs text-[#575752] leading-relaxed">
              Seken. menggunakan 5 skala ketegasan: <strong>10/10 Baru (BNWT)</strong>, <strong>9/10 Like New</strong> (sangat mulus), <strong>8/10 Very Good</strong> (jejak pakai minimal), <strong>7/10 Good Vintage</strong> (faded alami vintage), dan <strong>5-6/10 Flawed</strong> (ada noda/pinhole terdata di deskripsi).
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1.5">
            <h3 className="font-bold text-sm text-[#131313]">Bagaimana jika pembeli tidak sopan atau spamming?</h3>
            <p className="text-xs text-[#575752] leading-relaxed">
              Penjual memiliki wewenang penuh untuk memblokir pembeli melalui tombol <strong>Blokir Pengguna</strong> di chat inbox. Pengguna yang diblokir otomatis tidak bisa mengirim chat DM maupun membuat penawaran harga.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1.5">
            <h3 className="font-bold text-sm text-[#131313]">Bagaimana cara melacak pakaian yang saya beli?</h3>
            <p className="text-xs text-[#575752] leading-relaxed">
              Buka menu <strong>Pesan / Chat</strong> di inbox. Di atas riwayat percakapan transaksi, penjual dapat memasukkan nomor resi resmi kurir dan Anda dapat menyalin nomor resi tersebut untuk pelacakan.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: REPORT & SUPPORT */}
      {activeTab === "REPORT" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left: Direct Support Contacts (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-3">
              <span className="text-[10px] font-mono uppercase text-[#73736C] tracking-wider block">
                KONTAK RESMI PELAPORAN
              </span>
              <h3 className="font-bold text-base text-[#131313]">Dukungan Kolektor Seken.</h3>
              <p className="text-xs text-[#575752] leading-relaxed">
                Jika Anda menemukan penjual nakal, dugaan barang tiruan palsu, atau kendala akun, silakan hubungi tim kurator kami via email resmi:
              </p>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAF8F5] border border-[#E8E2D8]">
                <span className="text-xs font-mono font-bold text-[#131313]">{supportEmail}</span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#131313] hover:text-[#F34431] transition cursor-pointer"
                >
                  <IconCopy className="w-3.5 h-3.5" />
                  <span>{copiedEmail ? "Tersalin!" : "Salin Email"}</span>
                </button>
              </div>

              <div className="text-[11px] text-[#73736C] leading-normal pt-2">
                ⏱️ Waktu tanggapan rata-rata: <strong>1 × 24 Jam Kerja</strong>.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <IconAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Selalu utamakan pembayaran setelah resi terverifikasi atau COD di lokasi publik ramai (seperti stasiun, minimarket, atau mall).
              </p>
            </div>
          </div>

          {/* Right: Ticket Submission Form (7 cols) */}
          <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-[#E8E2D8] shadow-xs">
            <h3 className="font-bold text-sm text-[#131313] mb-1">Formulir Pengaduan / Tiket Bantuan</h3>
            <p className="text-xs text-[#73736C] mb-5">Kirimkan rincian kendala Anda untuk ditindaklanjuti tim Seken.</p>

            {reportSubmitted ? (
              <div className="p-6 text-center bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-sm font-bold">
                  ✓
                </div>
                <h4 className="font-bold text-sm text-emerald-950">Laporan Berhasil Terkirim</h4>
                <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                  Terima kasih atas laporan Anda. Tim kurator Seken. akan meninjau laporan ini dan menghubungi email Anda dalam 1x24 jam.
                </p>
                <button
                  type="button"
                  onClick={() => setReportSubmitted(false)}
                  className="text-xs font-bold text-emerald-900 underline mt-2 block mx-auto cursor-pointer"
                >
                  Kirim Laporan Lain
                </button>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4A48] mb-1">
                    Kategori Laporan:
                  </label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] text-[#131313] focus:outline-none focus:border-[#131313]"
                  >
                    <option value="TRANSACTION">Kendala Transaksi / Pembayaran</option>
                    <option value="FAKE_PRODUCT">Barang Tiruan / KW Tanpa Keterangan</option>
                    <option value="MISMATCH_SIZE">Ukuran PxL Berbeda Jauh dari Deskripsi</option>
                    <option value="SELLER_ISSUE">Penjual Tidak Mengirim Resi / Mengabaikan Chat</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A4A48] mb-1">
                    Email Anda untuk Balasan:
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={ticketForm.email}
                    onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] text-[#131313] focus:outline-none focus:border-[#131313]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A4A48] mb-1">
                    Subjek / Judul Masalah:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Penjual tidak mengirim resi untuk pesanan #1234"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] text-[#131313] focus:outline-none focus:border-[#131313]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A4A48] mb-1">
                    Rincian Masalah:
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Jelaskan secara rinci kronologi kejadian, username pihak terlapor, dan bukti yang Anda miliki..."
                    value={ticketForm.message}
                    onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E2D8] bg-[#FAF8F5] text-[#131313] focus:outline-none focus:border-[#131313]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-[#131313] hover:bg-[#F34431] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Kirim Tiket Laporan ke Tim Seken.
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
