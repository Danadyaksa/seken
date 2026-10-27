import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Seken. — Marketplace Pakaian Thrift & Vintage Baleran Impor",
  description: "Platform C2C jual beli pakaian thrift vintage kurasi dari baleran Jepang, Thailand, USA, dan China. Standar transparansi ukuran riil PxL dan catatan minus.",
  keywords: ["seken", "thrift", "vintage clothing", "thrift jepang", "band tees", "workwear", "baleran impor", "marketplace vintage"],
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/seken-logo-mark.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAF8F5] text-[#131313] font-sans selection:bg-[#F2EADE] selection:text-[#131313]">
        <Suspense fallback={<div className="h-16 bg-[#FAF8F5] border-b border-[#E8E0D5]" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
