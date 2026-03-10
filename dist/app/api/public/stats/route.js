export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export async function GET() {
  try {
    const [totalProducts, totalCustomers, materials] = await Promise.all([
      prisma.product.count(),
      prisma.user.count({ where: { role: "user" } }),
      prisma.product.groupBy({ by: ["material"] }),
    ]);
    const totalMaterials = materials.length;
    return NextResponse.json({ totalProducts, totalCustomers, totalMaterials });
  } catch (err) {
    console.error("Public stats error:", err);
    return NextResponse.json(
      { error: "Error fetching stats" },
      { status: 500 },
    );
  }
}
