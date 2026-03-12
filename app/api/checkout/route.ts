export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

const CheckoutItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  material: z.string().min(1),
  color: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
  dimX: z.number().nonnegative(),
  dimY: z.number().nonnegative(),
  dimZ: z.number().nonnegative(),
  unitPrice: z.number().nonnegative(),
});

const ShippingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional().default(""),
  zip: z.string().min(1, "ZIP code is required"),
  country: z.string().min(2, "Country is required"),
});

const CheckoutBodySchema = z.object({
  items: z.array(CheckoutItemSchema).min(1, "At least one item is required"),
  shipping: ShippingSchema,
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  shippingCost: z.number().nonnegative(),
  total: z.number().nonnegative(),
  couponCode: z.string().optional().nullable(),
});

// ---- Ayudante: construye line items para Stripe ---------------

type StripeLineItem = {
  price_data: {
    currency: string;
    product_data: { name: string };
    unit_amount: number;
  };
  quantity: number;
};

function buildStripeLineItems(
  items: z.infer<typeof CheckoutItemSchema>[],
  tax: number,
  shippingCost: number,
  discount: number,
  couponCode: string,
): StripeLineItem[] {
  const lineItems: StripeLineItem[] = items.map((i) => ({
    price_data: {
      currency: "eur",
      product_data: {
        name: `${i.name} (${i.material} - ${i.color})`,
      },
      unit_amount: Math.round(i.unitPrice * 100),
    },
    quantity: i.quantity,
  }));

  if (tax > 0) {
    lineItems.push({
      price_data: {
        currency: "eur",
        product_data: { name: "IVA (21%)" },
        unit_amount: Math.round(tax * 100),
      },
      quantity: 1,
    });
  }
  if (shippingCost > 0) {
    lineItems.push({
      price_data: {
        currency: "eur",
        product_data: { name: "Envío" },
        unit_amount: Math.round(shippingCost * 100),
      },
      quantity: 1,
    });
  }
  if (discount > 0) {
    lineItems.push({
      price_data: {
        currency: "eur",
        product_data: { name: `Descuento (${couponCode})` },
        unit_amount: -Math.round(discount * 100),
      },
      quantity: 1,
    });
  }
  return lineItems;
}

// -------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as Record<string, unknown>)?.id as string;
    const body = await req.json();
    const parsed = CheckoutBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }
    const { items, shipping, subtotal, tax, shippingCost, total, couponCode } =
      parsed.data;

    // ---- Validar cupón si se proporcionó ----
    let couponId: string | null = null;
    let discount = 0;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: String(couponCode).toUpperCase() },
      });
      const now = new Date();
      const isValid =
        coupon &&
        coupon.isActive &&
        (!coupon.validUntil || coupon.validUntil >= now) &&
        (coupon.maxUses === null || coupon.usedCount < coupon.maxUses) &&
        (coupon.minPurchase === null || (subtotal ?? 0) >= coupon.minPurchase);
      if (isValid && coupon) {
        couponId = coupon.id;
        discount =
          coupon.discountType === "percentage"
            ? ((subtotal ?? 0) * coupon.discountValue) / 100
            : coupon.discountValue;
        discount = Math.round(discount * 100) / 100;
      }
    }

    const finalTotal = Math.max(0, (total ?? 0) - discount);

    // ---- Crear orden ----
    const order = await prisma.order.create({
      data: {
        userId,
        subtotal: subtotal ?? 0,
        tax: tax ?? 0,
        shipping: shippingCost,
        discount,
        total: finalTotal,
        status: "pending",
        couponId,
        shippingName: shipping.name,
        shippingEmail: shipping.email,
        shippingPhone: shipping.phone,
        shippingAddress: shipping.address,
        shippingCity: shipping.city,
        shippingState: shipping.state,
        shippingZip: shipping.zip,
        shippingCountry: shipping.country,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            material: i.material,
            color: i.color,
            quantity: i.quantity,
            dimX: i.dimX,
            dimY: i.dimY,
            dimZ: i.dimZ,
            unitPrice: i.unitPrice,
          })),
        },
      },
    });

    const origin = req.headers.get("origin") ?? "http://localhost:3000";

    const lineItems = buildStripeLineItems(
      items,
      tax,
      shippingCost,
      discount,
      couponCode ?? "",
    );

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      metadata: { orderId: order.id, couponId: couponId ?? "" },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: stripeSession.id },
    });

    return NextResponse.json({
      url: stripeSession.url,
      orderId: order.id,
      discount,
    });
  } catch (err: unknown) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
