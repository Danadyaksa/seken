"use client";

import React, { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { IconArrowRight } from "@/components/Icons";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface HeroProduct {
  id: string;
  title: string;
  price: number;
  size: string;
  chestWidthCm?: number | null;
  lengthCm?: number | null;
  condition: string;
  originCountryCode: string;
  originCountry?: {
    code: string;
    name: string;
    flagEmoji: string;
  } | null;
  category?: {
    name: string;
    slug: string;
  } | null;
  images: {
    imageUrl: string;
    isPrimary: boolean;
  }[];
}

interface CountryItem {
  code: string;
  name: string;
  flagEmoji: string;
}

interface HeroSectionProps {
  featuredProduct?: HeroProduct | null;
  countries: CountryItem[];
  currentCountry?: string;
  currentCategory?: string;
  searchQuery?: string;
}

export default function HeroSection({
  featuredProduct,
  countries,
  currentCountry,
  currentCategory,
  searchQuery,
}: HeroSectionProps) {
  const containerRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const featuredImage =
    featuredProduct?.images?.find((img) => img.isPrimary)?.imageUrl ||
    featuredProduct?.images?.[0]?.imageUrl ||
    "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800";

  const conditionLabels: Record<string, { label: string; score: string }> = {
    BRAND_NEW: { label: "10/10 Baru", score: "Grade 10/10" },
    LIKE_NEW: { label: "9.5/10 Like New", score: "Grade 9.5/10" },
    VERY_GOOD: { label: "8.5/10 Very Good", score: "Grade 8.5/10" },
    GOOD: { label: "7.5/10 Vintage", score: "Grade 7.5/10" },
    FLAWED_VINTAGE: { label: "6/10 Minus Terdata", score: "Grade 6/10" },
  };

  // GSAP Timeline Entry & Apple-style Fluid Tilt
  useGSAP(
    () => {
      // Respect user's reduced-motion preference
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) return;

      // 1. Choreographed entry sequence via GSAP Timeline
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".gsap-badge", {
        opacity: 0,
        y: 16,
        duration: 0.55,
        clearProps: "all",
      })
        .from(
          ".gsap-title-line",
          {
            opacity: 0,
            y: 28,
            duration: 0.7,
            stagger: 0.12,
            clearProps: "all",
          },
          "-=0.3"
        )
        .from(
          ".gsap-desc",
          {
            opacity: 0,
            y: 18,
            duration: 0.6,
            clearProps: "all",
          },
          "-=0.4"
        )
        .from(
          ".gsap-indicator",
          {
            opacity: 0,
            y: 12,
            duration: 0.45,
            stagger: 0.08,
            clearProps: "all",
          },
          "-=0.3"
        )
        .fromTo(
          ".gsap-pill",
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.04,
            clearProps: "all",
          },
          "-=0.25"
        )
        .from(
          cardRef.current,
          {
            opacity: 0,
            y: 35,
            scale: 0.96,
            duration: 0.8,
            ease: "power2.out",
            clearProps: "opacity,scale",
          },
          "-=0.4"
        );

      // 2. GSAP ScrollTrigger Parallax (targets independent parallax container)
      gsap.to(".gsap-parallax-bg", {
        y: 35,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.2,
        },
      });

      gsap.to(".gsap-card-parallax", {
        y: -25,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });

      // 3. Apple Fluid 3D Tilt with gsap.quickTo (zero GC lag)
      if (cardRef.current && window.matchMedia("(pointer: fine)").matches) {
        const card = cardRef.current;
        const xRotTo = gsap.quickTo(card, "rotationX", { duration: 0.35, ease: "power2.out" });
        const yRotTo = gsap.quickTo(card, "rotationY", { duration: 0.35, ease: "power2.out" });

        const handleMouseMove = (e: MouseEvent) => {
          const rect = card.getBoundingClientRect();
          const x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
          const y = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

          // Subtle physical tilt (max 4.5 degrees)
          xRotTo(-y * 4.5);
          yRotTo(x * 4.5);
        };

        const handleMouseLeave = () => {
          xRotTo(0);
          yRotTo(0);
        };

        card.addEventListener("mousemove", handleMouseMove);
        card.addEventListener("mouseleave", handleMouseLeave);

        return () => {
          card.removeEventListener("mousemove", handleMouseMove);
          card.removeEventListener("mouseleave", handleMouseLeave);
        };
      }
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden border-b border-[#E8E2D8] bg-[#FAF8F5] pt-12 pb-14 px-4 sm:px-6 lg:px-8 select-none-safe"
    >
      {/* 1. ARCHIVAL TEXTURE & GRAPHIC ORNAMENTS */}

      {/* SVG Analog Film/Denim Grain Texture */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035] mix-blend-multiply"
        aria-hidden="true"
      >
        <filter id="seken-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.07   0 0 0 0 0.07   0 0 0 0 0.07  0 0 0 1 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#seken-grain)" />
      </svg>

      {/* Tailor Cutting Blueprint Grid */}
      <div className="absolute inset-0 seken-tailor-grid pointer-events-none" />

      {/* Parallax Atmospheric Warm Radial Glow */}
      <div className="gsap-parallax-bg absolute -top-28 right-4 w-[560px] h-[560px] bg-[#F2EADE]/70 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Vintage Japanese Archival Stamp Watermark (古着 / Furugi) */}
      <div
        className="gsap-parallax-bg absolute top-8 right-[18%] w-72 h-72 pointer-events-none opacity-[0.045] select-none hidden lg:block"
        aria-hidden="true"
      >
        <svg viewBox="0 0 200 200" className="w-full h-full text-[#131313]" fill="currentColor">
          <circle cx="100" cy="100" r="92" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 4" fill="none" />
          <circle cx="100" cy="100" r="78" stroke="currentColor" strokeWidth="1.5" fill="none" />
          {/* Circular Stamp Text Path */}
          <path id="stampPath" d="M 100, 100 m -62, 0 a 62,62 0 1,1 124,0 a 62,62 0 1,1 -124,0" fill="none" />
          <text fontSize="9.5" fontWeight="bold" letterSpacing="2.5" fill="currentColor">
            <textPath href="#stampPath" startOffset="50%" textAnchor="middle">
              SEKEN ARCHIVE SPECIMEN · 0% ADMIN FEE ·
            </textPath>
          </text>
          {/* Kanji Center "古着" */}
          <text
            x="100"
            y="114"
            fontSize="44"
            fontFamily="serif"
            fontWeight="bold"
            textAnchor="middle"
            fill="currentColor"
          >
            古着
          </text>
        </svg>
      </div>

      {/* Blueprint Crosshair Registration Marks */}
      <div className="absolute top-4 left-4 text-[#C8BFB0] font-mono text-[9px] pointer-events-none hidden sm:flex items-center gap-2">
        <span className="text-xs font-bold leading-none">+</span>
        <span>SPECIMEN ARCHIVE // 35°39&apos;N 139°44&apos;E</span>
      </div>
      <div className="absolute top-4 right-4 text-[#C8BFB0] font-mono text-[9px] pointer-events-none hidden sm:flex items-center gap-2">
        <span>BATCH 04 // 2026 EDITION</span>
        <span className="text-xs font-bold leading-none">+</span>
      </div>

      {/* 2. MAIN 12-COLUMN EDITORIAL HERO */}
      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Heading, Proof & Country Filter (7 Cols) */}
        <div className="lg:col-span-7">
          {/* Curated Archive Badge */}
          <div className="gsap-badge inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#131313] text-[#FAF8F5] text-[11px] font-mono uppercase tracking-wider mb-4 border border-[#131313] shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F34431] animate-pulse" />
            <span>ARSIP BALERAN TERVERIFIKASI · P2P KOLEKTOR</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#131313] tracking-[-0.035em] leading-[1.08] mb-4">
            <span className="gsap-title-line block">Pakaian Vintage Terpilih.</span>
            <span className="gsap-title-line block text-[#F34431]">Jepang, Thailand, USA & China.</span>
          </h1>

          <p className="gsap-desc text-sm sm:text-base text-[#3D3D3A] leading-relaxed max-w-xl">
            Jual beli pakaian thrift vintage langsung antar sesama kolektor. Tanpa biaya admin perantara, dengan
            transparansi ukuran riil Panjang × Lebar dada (cm) dan catatan minus di setiap pakaian.
          </p>

          {/* Micro Value Indicators */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-5 text-xs text-[#575752] font-medium">
            <span className="gsap-indicator flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
              <span>0% Biaya Admin Perantara</span>
            </span>
            <span className="text-[#D8D0C3]">·</span>
            <span className="gsap-indicator flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#131313]" />
              <span>Inspeksi Ukuran PxL Riil</span>
            </span>
            <span className="text-[#D8D0C3]">·</span>
            <span className="gsap-indicator flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F34431]" />
              <span>Catatan Minus Transparan</span>
            </span>
          </div>

          {/* Curated Baleran Provenance Selector (Linear Pills) */}
          <div className="mt-8 pt-6 border-t border-[#E8E2D8]/70 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <Link
              href="/"
              className={`gsap-pill px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer border active:scale-[0.98] ${
                !currentCountry
                  ? "bg-[#131313] text-[#FAF8F5] border-[#131313] shadow-xs"
                  : "bg-white text-[#3D3D3A] border-[#E8E2D8] hover:border-[#131313] hover:bg-[#F2EADE]/40"
              }`}
            >
              Semua Baleran
            </Link>
            {countries.map((c) => {
              const isActive = currentCountry?.toUpperCase() === c.code;
              return (
                <Link
                  key={c.code}
                  href={`/?country=${c.code}${currentCategory ? `&category=${currentCategory}` : ""}${
                    searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""
                  }`}
                  className={`gsap-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer border active:scale-[0.98] ${
                    isActive
                      ? "bg-[#131313] text-[#FAF8F5] border-[#131313] shadow-xs"
                      : "bg-white text-[#3D3D3A] border-[#E8E2D8] hover:border-[#131313] hover:bg-[#F2EADE]/40"
                  }`}
                >
                  <span
                    className={`px-1 rounded text-[10px] font-bold ${
                      isActive ? "bg-[#FAF8F5]/20 text-[#FAF8F5]" : "bg-[#F2EADE] text-[#131313]"
                    }`}
                  >
                    {c.code}
                  </span>
                  <span>{c.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Column: Physical Garment Inspection Specimen Card with Fluid 3D Tilt (5 Cols) */}
        {featuredProduct && (
          <div className="gsap-card-parallax lg:col-span-5 flex justify-center lg:justify-end">
            <div
              ref={cardRef}
              style={{ transformStyle: "preserve-3d", perspective: 1000 }}
              className="gsap-card relative w-full max-w-sm sm:max-w-md animate-gentle-float hover:[animation-play-state:paused] will-change-transform"
            >
              {/* Secondary Stamp Badge in Corner */}
              <div className="absolute -top-3 -right-3 z-20 bg-[#F34431] text-white text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded shadow-md transform rotate-2">
                PxL TERVERIFIKASI
              </div>

              {/* Main Physical Inspection Specimen Card */}
              <div className="bg-white rounded-2xl border-2 border-[#131313] shadow-[6px_6px_0px_0px_#131313] overflow-hidden transition-shadow duration-300 hover:shadow-[10px_10px_0px_0px_#131313]">
                {/* Top Punch Hole / Archival Tag Header */}
                <div className="flex items-center justify-between border-b border-[#E8E2D8] bg-[#FAF8F5] px-4 py-2.5 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-[#B8AEA0] bg-[#FAF8F5] shadow-inner inline-block" />
                    <span className="font-bold text-[#131313] tracking-wider">
                      SPECIMEN #{featuredProduct.originCountryCode}-{featuredProduct.id.slice(-4).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#059669] bg-[#059669]/10 px-2 py-0.5 rounded">
                    {conditionLabels[featuredProduct.condition]?.label || "Grade A"}
                  </span>
                </div>

                {/* Garment Visual Frame with Real Measurement Pins */}
                <Link
                  href={`/products/${featuredProduct.id}`}
                  className="group block relative aspect-[4/3] bg-[#F2EADE]/40 overflow-hidden cursor-pointer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredImage}
                    alt={featuredProduct.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Origin Tag Pill (Top Left) */}
                  <div className="absolute top-3 left-3 bg-[#131313]/90 text-white backdrop-blur-xs px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <span className="text-[#F34431]">{featuredProduct.originCountryCode}</span>
                    <span className="text-[#73736C]">·</span>
                    <span>{featuredProduct.originCountry?.name}</span>
                  </div>

                  {/* Category Overlay (Bottom Left) */}
                  <div className="absolute bottom-3 left-3 bg-white/95 text-[#131313] backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold shadow-xs">
                    {featuredProduct.category?.name}
                  </div>

                  {/* Measurement Radar Pin 1: Chest Width */}
                  {featuredProduct.chestWidthCm && (
                    <div className="absolute top-[46%] left-[34%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="relative flex items-center gap-1.5 bg-[#131313] text-[#FAF8F5] text-[10px] font-mono font-bold px-2.5 py-1 rounded-md shadow-lg border border-white/20">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-radar-pulse absolute inline-flex h-full w-full rounded-full bg-[#F34431] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F34431]"></span>
                        </span>
                        <span>Lebar: {featuredProduct.chestWidthCm} cm</span>
                      </div>
                    </div>
                  )}

                  {/* Measurement Radar Pin 2: Length */}
                  {featuredProduct.lengthCm && (
                    <div className="absolute bottom-[24%] right-[24%] translate-x-1/2 translate-y-1/2 pointer-events-none">
                      <div className="relative flex items-center gap-1.5 bg-[#131313] text-[#FAF8F5] text-[10px] font-mono font-bold px-2.5 py-1 rounded-md shadow-lg border border-white/20">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-radar-pulse absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
                        </span>
                        <span>Panjang: {featuredProduct.lengthCm} cm</span>
                      </div>
                    </div>
                  )}
                </Link>

                {/* Card Content & Action */}
                <div className="p-4 bg-white">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-[#73736C] uppercase tracking-wider block mb-0.5">
                        Ukuran Terverifikasi
                      </span>
                      <Link
                        href={`/products/${featuredProduct.id}`}
                        className="font-bold text-sm text-[#131313] line-clamp-1 hover:text-[#F34431] transition-colors"
                      >
                        {featuredProduct.title}
                      </Link>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-[#F2EADE] text-[#131313] font-mono font-bold text-xs shrink-0 border border-[#E8E2D8]">
                      Size {featuredProduct.size}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#E8E2D8]">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-[#73736C] block leading-none mb-1">
                        Harga Koleksi
                      </span>
                      <span className="text-base font-black text-[#131313]">
                        {featuredProduct.price === 0
                          ? "GRATIS"
                          : new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                              maximumFractionDigits: 0,
                            }).format(featuredProduct.price)}
                      </span>
                    </div>

                    <Link
                      href={`/products/${featuredProduct.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#131313] text-[#FAF8F5] text-xs font-bold hover:bg-[#F34431] transition-colors shadow-xs active:scale-[0.98]"
                    >
                      <span>Periksa Pakaian</span>
                      <IconArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Archival Authenticity Micro Footer */}
                <div className="bg-[#FAF8F5] border-t border-[#E8E2D8] px-4 py-2 flex items-center justify-between text-[10px] font-mono text-[#73736C]">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#059669]"></span> P2P DIRECT CHAT
                  </span>
                  <span>BEBAS BIAYA ADMIN 0%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. VINTAGE TAILOR MEASUREMENT TAPE RULER TICKER */}
      <div
        className="absolute bottom-0 left-0 right-0 h-6 border-t border-[#E8E2D8] bg-[#F2EADE]/60 overflow-hidden flex items-center text-[9px] font-mono text-[#7A7A73] select-none"
        aria-hidden="true"
      >
        <div className="flex items-center gap-8 whitespace-nowrap pl-4">
          <span className="font-bold text-[#131313]">SEKEN SPECIMEN ARCHIVE</span>
          <span className="flex items-center gap-3">
            <span>00cm</span>
            <span className="tracking-widest">| · · · · | · · · · |</span>
            <span>20cm</span>
            <span className="tracking-widest">| · · · · | · · · · |</span>
            <span>40cm</span>
            <span className="tracking-widest">| · · · · | · · · · |</span>
            <span>60cm</span>
            <span className="tracking-widest">| · · · · | · · · · |</span>
            <span>80cm</span>
            <span className="tracking-widest">| · · · · | · · · · |</span>
            <span>100cm</span>
          </span>
          <span className="text-[#F34431] font-semibold">1:1 ACTUAL GARMENT MEASUREMENTS</span>
          <span className="flex items-center gap-3">
            <span>120cm</span>
            <span className="tracking-widest">| · · · · | · · · · |</span>
            <span>140cm</span>
            <span className="tracking-widest">| · · · · | · · · · |</span>
            <span>160cm</span>
          </span>
        </div>
      </div>
    </section>
  );
}
