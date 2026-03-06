export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as Record<string, unknown>)?.id as string;
    const body = await req.json();
    const { items, shipping, subtotal, tax, shippingCost, total } = body ?? {};

    if (!items?.length) return NextResponse.json({ error: "No items" }, { status: 400 });

    const order = await prisma.order.create({
      data: {
        userId,
        subtotal: subtotal ?? 0,
        tax: tax ?? 0,
        shipping: shippingCost ?? 0,
        total: total ?? 0,
        status: "pending",
        shippingName: shipping?.name ?? "",
        shippingEmail: shipping?.email ?? "",
        shippingPhone: shipping?.phone ?? "",
        shippingAddress: shipping?.address ?? "",
        shippingCity: shipping?.city ?? "",
        shippingState: shipping?.state ?? "",
        shippingZip: shipping?.zip ?? "",
        shippingCountry: shipping?.country ?? "",
        items: {
          create: (items ?? []).map((i: Record<string, unknown>) => ({
            productId: (i?.productId as string) ?? "",
            name: (i?.name as string) ?? "",
            material: (i?.material as string) ?? "",
            color: (i?.color as string) ?? "",
            quantity: (i?.quantity as number) ?? 1,
            dimX: (i?.dimX as number) ?? 0,
            dimY: (i?.dimY as number) ?? 0,
            dimZ: (i?.dimZ as number) ?? 0,
            unitPrice: (i?.unitPrice as number) ?? 0,
          })),
        },
      },
    });

    const origin = req.headers.get("origin") ?? "http://localhost:3000";

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: (items ?? []).map((i: Record<string, unknown>) => ({
        price_data: {
          currency: "eur",
          product_data: { name: `${(i?.name as string) ?? "Producto"} (${(i?.material as string) ?? ""} - ${(i?.color as string) ?? ""})` },
          unit_amount: Math.round(((i?.unitPrice as number) ?? 0) * 100),
        },
        quantity: (i?.quantity as number) ?? 1,
      })),
      metadata: { orderId: order.id },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
    });

    await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: stripeSession.id } });

    return NextResponse.json({ url: stripeSession.url, orderId: order.id });
  } catch (err: unknown) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
