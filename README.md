# Carousell Thrift Clone - Cross-Country Thrifting Marketplace 🇯🇵🇹🇭🇨🇳🇮🇩🇺🇸

Marketplace jual beli pakaian thrift vintage lintas negara (Jepang, Thailand, China, Indonesia, dan USA) terinspirasi oleh [id.carousell.com](https://id.carousell.com/). Dibangun menggunakan **Next.js 16 App Router**, **TypeScript**, **Tailwind CSS v4**, dan **Prisma ORM**.

---

## ⚡ Fitur Utama

- **Katalog Thrifting Lintas Negara**: Filter pakaian berdasarkan asal baleran impor (Jepang, Thailand, China, Indonesia, USA), kategori, dan kata kunci.
- **Transparansi Ukuran & Minus**: Setiap listing wajib mencantumkan ukuran riil PxL (Panjang x Lebar cm), badge kondisi (*Brand New*, *Like New*, *Good*, *Flawed Vintage*), serta catatan minus/cacat.
- **In-App Offer & WhatsApp Handshake (Aturan 8)**: Pembeli dapat mengajukan penawaran harga di aplikasi, membuka obrolan negosiasi otomatis, dan melanjutkan transaksi di luar aplikasi via WhatsApp resmi penjual atau COD langsung di lokasi (Zero Payment Gateway).
- **Inventaris Penjual (`/my-listings`)**: Mengelola status barang secara cepat (`Tersedia`, `Dibooking`, `Terjual`) dan hapus listing dengan proteksi IDOR.
- **Etalase Toko Penjual (`/seller/[username]`)**: Halaman toko dengan rekam jejak ulasan bintang dan daftar pakaian aktif.
- **Autentikasi Aman**: JWT session dengan cookie HttpOnly, bcrypt password hashing, dan tombol 1-Click Demo Login untuk pengujian cepat.

---

## 🔑 Akun Demo Pengujian (1-Klik di Halaman Login)

| Role | Email | Password | Kegunaan |
|---|---|---|---|
| **Penjual (Seller)** | `seller@thrift.com` | `password123` | Mengelola inventaris, pasang iklan, menerima tawaran |
| **Pembeli (Buyer)** | `buyer@thrift.com` | `password123` | Menawar pakaian, melihat detail, negosiasi obrolan |

---

## 🛠️ Cara Menjalankan Secara Lokal

1. **Clone repository dan install dependencies**:
   ```bash
   npm install
   ```

2. **Setup Database SQLite & Seeding**:
   ```bash
   npx prisma db push
   npx tsx prisma/seed.ts
   ```

3. **Jalankan Development Server**:
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser.

4. **Uji Build Produksi**:
   ```bash
   npm run build
   npm run start
   ```

---

## 🚀 Panduan Deployment ke Vercel + Supabase

1. Buat database PostgreSQL di [Supabase](https://supabase.com).
2. Ubah `provider = "postgresql"` di `prisma/schema.prisma`.
3. Atur Environment Variables di project Vercel:
   - `DATABASE_URL`: URL koneksi PostgreSQL Supabase
   - `JWT_SECRET`: Random string minimal 32 karakter
   - `NEXT_PUBLIC_APP_URL`: URL domain Vercel Anda
4. Deploy langsung via GitHub integration di Vercel.
