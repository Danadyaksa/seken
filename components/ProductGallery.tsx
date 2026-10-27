"use client";

import { useState } from "react";

interface ProductGalleryProps {
  images: { id: string; imageUrl: string; isPrimary: boolean }[];
  title: string;
  originCountry: { flagEmoji: string; name: string };
  status: string;
}

export default function ProductGallery({
  images,
  title,
  originCountry,
  status,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const displayImages = images.length > 0 
    ? images 
    : [{ id: "placeholder", imageUrl: "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=1000&auto=format&fit=crop&q=80", isPrimary: true }];

  const currentImage = displayImages[selectedIndex] || displayImages[0];

  return (
    <div className="space-y-3">
      {/* Main Large Image Container */}
      <div className="relative aspect-[4/5] sm:aspect-square w-full rounded-2xl overflow-hidden bg-[#F2EADE] border border-[#E8E2D8] group shadow-xs">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentImage.imageUrl}
          alt={`${title} - Foto ${selectedIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
        />

        {/* Provenance Stamp */}
        <div className="absolute top-3 left-3 bg-[#131313]/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-sm">
          <span className="text-[#F2EADE] font-bold">Baleran</span>
          <span>{originCountry.name}</span>
        </div>

        {/* Photo counter chip */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-[#131313]/80 backdrop-blur-md px-2.5 py-1 rounded-md text-white text-[10px] font-bold">
            {selectedIndex + 1} / {displayImages.length}
          </div>
        )}

        {/* Sold / Reserved Overlay */}
        {status !== "AVAILABLE" && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-5 py-2 rounded-lg text-sm font-bold bg-white text-[#131313] shadow-lg">
              {status === "SOLD" ? "Sudah Terjual" : "Sedang Dibooking"}
            </span>
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {displayImages.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {displayImages.map((img, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-[#F2EADE] ${
                  isSelected
                    ? "border-[#131313] shadow-md ring-2 ring-[#F34431]/25 scale-102"
                    : "border-[#E8E2D8] opacity-75 hover:opacity-100 hover:border-[#131313]"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.imageUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {img.isPrimary && (
                  <span className="absolute top-1 left-1 bg-[#131313] text-white text-[8px] font-bold px-1 rounded">
                    Cover
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
