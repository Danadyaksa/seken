import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import SellForm from "@/components/SellForm";
import SellerSidebarLayout from "@/components/SellerSidebarLayout";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pasang Iklan Pakaian Thrift | Seken.",
};

export default async function SellPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login?redirect=/sell");
  }

  const [categories, countries] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.originCountry.findMany(),
  ]);

  return (
    <SellerSidebarLayout user={user}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="mb-6 pb-4 border-b border-[#E8E0D5]">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131313] tracking-tight">
            Pasang Iklan Pakaian Thrift
          </h1>
          <p className="text-xs sm:text-sm text-[#4A4A48] mt-1.5 leading-relaxed">
            Lengkapi rincian asal baleran impor, inspeksi ukuran riil Panjang × Lebar Dada (cm), dan catatan kondisi pakaian.
          </p>
        </div>

        <SellForm
          categories={categories}
          countries={countries}
          userCity={user.profile?.city}
        />
      </div>
    </SellerSidebarLayout>
  );
}
