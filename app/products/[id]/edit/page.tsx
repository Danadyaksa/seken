import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import SellForm from "@/components/SellForm";
import SellerSidebarLayout from "@/components/SellerSidebarLayout";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/auth/login?redirect=/products/${id}/edit`);
  }

  const [product, categories, countries] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.originCountry.findMany(),
  ]);

  if (!product) {
    notFound();
  }

  // IDOR Protection: only owner can edit
  if (product.sellerId !== user.id) {
    redirect("/my-listings");
  }

  return (
    <SellerSidebarLayout user={user}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#7A7A73]">
          <Link href="/my-listings" className="hover:text-[#131313] transition font-medium">
            ← Kembali ke Inventaris
          </Link>
          <span>/</span>
          <span className="text-[#131313] font-semibold truncate">Edit {product.title}</span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#131313] tracking-tight">
            Perbarui Listing Pakaian
          </h1>
          <p className="text-xs sm:text-sm text-[#575752] mt-1">
            Ubah deskripsi, harga tawar, catatan minus, atau tambahkan foto detail pakaian.
          </p>
        </div>

        <SellForm
          mode="edit"
          categories={categories}
          countries={countries}
          initialProduct={product}
          userCity={user.profile?.city}
        />
      </div>
    </SellerSidebarLayout>
  );
}
