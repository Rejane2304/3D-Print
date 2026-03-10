export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ items: [] });
    const userId = (session.user as Record<string, unknown>)?.id as string;
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });
    return NextResponse.json({ items: cart?.items ?? [] });
  } catch (err: unknown) {
    console.error("Cart fetch error:", err);
    return NextResponse.json({ items: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as Record<string, unknown>)?.id as string;
    const body = await req.json();
    const {
      productId,
      material,
      color,
      quantity,
      dimX,
      dimY,
      dimZ,
      unitPrice,
    } = body ?? {};
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) cart = await prisma.cart.create({ data: { userId } });
    const item = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        material,
        color,
        quantity: quantity ?? 1,
        dimX,
        dimY,
        dimZ,
        unitPrice,
      },
      include: { product: true },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err: unknown) {
    console.error("Cart add error:", err);
    return NextResponse.json(
      { error: "Error adding to cart" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = new URL(req.url);
    const itemId = url.searchParams.get("itemId");
    if (itemId) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("Cart delete error:", err);
    return NextResponse.json(
      { error: "Error removing from cart" },
      { status: 500 },
    );
  }
}
