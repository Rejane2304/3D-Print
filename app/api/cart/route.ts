export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

const CartItemSchema = z.object({
  productId: z.string().min(1, "productId is required"),
  material: z.string().min(1, "material is required"),
  color: z.string().min(1, "color is required"),
  quantity: z.number().int().min(1).max(99).default(1),
  dimX: z.number().positive("dimX must be positive"),
  dimY: z.number().positive("dimY must be positive"),
  dimZ: z.number().positive("dimZ must be positive"),
  unitPrice: z.number().nonnegative("unitPrice must be non-negative"),
});

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
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as Record<string, unknown>)?.id as string;
    const body = await req.json();
    const parsed = CartItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { productId, material, color, quantity, dimX, dimY, dimZ, unitPrice } = parsed.data;
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) cart = await prisma.cart.create({ data: { userId } });
    const item = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        material,
        color,
        quantity,
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
    return NextResponse.json({ error: "Error adding to cart" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = new URL(req.url);
    const itemId = url.searchParams.get("itemId");
    if (itemId) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("Cart delete error:", err);
    return NextResponse.json({ error: "Error removing from cart" }, { status: 500 });
  }
}
