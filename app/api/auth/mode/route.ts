import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
    }

    const body = await req.json();
    const newMode = body.mode === "SELLER" ? "SELLER" : "BUYER";

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { activeMode: newMode },
      select: {
        id: true,
        name: true,
        activeMode: true,
      },
    });

    return NextResponse.json({
      success: true,
      activeMode: updated.activeMode,
      message: newMode === "SELLER" ? "Beralih ke Mode Penjual (Toko Saya)." : "Beralih ke Mode Pembeli.",
    });
  } catch (error) {
    console.error("Switch Mode Error:", error);
    return NextResponse.json({ error: "Gagal beralih mode akun." }, { status: 500 });
  }
}
