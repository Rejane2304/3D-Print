export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  // Next.js puede pasar params como promesa, resolvemos si es necesario
  let params: { id: string };
  if (context.params instanceof Promise) {
    params = await context.params;
  } else {
    params = context.params;
  }
  let status = 200;
  let response: any = null;
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id || "" },
      include: {
        reviews: {
          include: { user: { select: { name: true, email: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });
    if (product === null) {
      status = 404;
      response = { error: "Product not found" };
    } else {
      response = product;
    }
  } catch (err) {
    console.error("Product fetch error:", err);
    status = 500;
    response = { error: "Error fetching product" };
  }
  return NextResponse.json(response, { status });
}
