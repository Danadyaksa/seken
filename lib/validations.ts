import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(20, "Username maksimal 20 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  whatsappNumber: z
    .string()
    .min(9, "Nomor WhatsApp minimal 9 digit")
    .regex(/^(\+62|62|08)[0-9]+$/, "Nomor WhatsApp harus format Indonesia (contoh: 08123456789)"),
  city: z.string().min(2, "Kota minimal 2 karakter").default("Jakarta"),
  role: z.enum(["BUYER", "SELLER"]).default("BUYER"),
});

export const LoginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const ProductSchema = z.object({
  title: z.string().min(3, "Judul pakaian minimal 3 karakter").max(100, "Judul maksimal 100 karakter"),
  description: z.string().optional().default(""),
  categoryId: z.string().min(1, "Pilih kategori pakaian"),
  originCountryCode: z.enum(["JP", "TH", "CN", "ID", "US"], {
    message: "Pilih negara asal impor (Jepang, Thailand, China, Indonesia, USA)",
  }),
  price: z.coerce.number().int().min(0, "Harga tidak boleh negatif"),
  size: z.string().min(1, "Ukuran pakaian wajib diisi (misal: M, L, XL)"),
  chestWidthCm: z.coerce.number().int().positive("Lebar dada harus angka positif").optional().nullable(),
  lengthCm: z.coerce.number().int().positive("Panjang baju harus angka positif").optional().nullable(),
  condition: z.enum(["BRAND_NEW", "LIKE_NEW", "VERY_GOOD", "GOOD", "FLAWED_VINTAGE"], {
    message: "Kondisi harus: Brand New, Like New, Very Good, Good, atau Flawed Vintage",
  }),
  defectNotes: z.string().optional().nullable(),
  city: z.string().min(2, "Kota penjual wajib diisi"),
  canCod: z.boolean().default(false),
  codArea: z.string().optional().nullable(),
  canDelivery: z.boolean().default(true),
  shippingNotes: z.string().optional().nullable(),
  imageUrls: z.array(z.string().url("URL gambar tidak valid")).min(1, "Wajib mengunggah minimal 1 foto produk"),
  primaryImageIndex: z.coerce.number().int().min(0).default(0),
});

export const OfferSchema = z.object({
  productId: z.string().min(1, "ID produk wajib diisi"),
  offeredPrice: z.coerce.number().int().positive("Harga tawaran harus lebih besar dari 0"),
});

export const UpdateStatusSchema = z.object({
  productId: z.string().min(1, "ID produk wajib diisi"),
  status: z.enum(["AVAILABLE", "RESERVED", "SOLD", "ARCHIVED"]),
});
