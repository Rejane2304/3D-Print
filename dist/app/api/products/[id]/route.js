export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export async function GET(_req, { params }) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params?.id ?? "" },
      include: {
        reviews: {
          include: { user: { select: { name: true, email: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });
    if (!product)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch (err) {
    console.error("Product fetch error:", err);
    return NextResponse.json(
      { error: "Error fetching product" },
      { status: 500 },
    );
  }
}
