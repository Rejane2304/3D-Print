export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
function buildStripeLineItems(items, tax, shippingCost, discount, couponCode) {
    const lineItems = items.map(i => ({
        price_data: {
            currency: "eur",
            product_data: {
                name: `${i?.name ?? "Producto"} (${i?.material ?? ""} - ${i?.color ?? ""})`,
            },
            unit_amount: Math.round((i?.unitPrice ?? 0) * 100),
        },
        quantity: i?.quantity ?? 1,
    }));
    if (tax > 0) {
        lineItems.push({ price_data: { currency: "eur", product_data: { name: "IVA (21%)" }, unit_amount: Math.round(tax * 100) }, quantity: 1 });
    }
    if (shippingCost > 0) {
        lineItems.push({ price_data: { currency: "eur", product_data: { name: "Envío" }, unit_amount: Math.round(shippingCost * 100) }, quantity: 1 });
    }
    if (discount > 0) {
        lineItems.push({ price_data: { currency: "eur", product_data: { name: `Descuento (${couponCode})` }, unit_amount: -Math.round(discount * 100) }, quantity: 1 });
    }
    return lineItems;
}
// -------------------------------------------------------------
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = session.user?.id;
        const body = await req.json();
        const { items, shipping, subtotal, tax, shippingCost, total, couponCode } = body ?? {};
        if (!items?.length)
            return NextResponse.json({ error: "No items" }, { status: 400 });
        // ---- Validar cupón si se proporcionó ----
        let couponId = null;
        let discount = 0;
        if (couponCode) {
            const coupon = await prisma.coupon.findUnique({
                where: { code: String(couponCode).toUpperCase() },
            });
            const now = new Date();
            const isValid = coupon &&
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
                shipping: shippingCost ?? 0,
                discount,
                total: finalTotal,
                status: "pending",
                couponId,
                shippingName: shipping?.name ?? "",
                shippingEmail: shipping?.email ?? "",
                shippingPhone: shipping?.phone ?? "",
                shippingAddress: shipping?.address ?? "",
                shippingCity: shipping?.city ?? "",
                shippingState: shipping?.state ?? "",
                shippingZip: shipping?.zip ?? "",
                shippingCountry: shipping?.country ?? "",
                items: {
                    create: (items ?? []).map((i) => ({
                        productId: i?.productId ?? "",
                        name: i?.name ?? "",
                        material: i?.material ?? "",
                        color: i?.color ?? "",
                        quantity: i?.quantity ?? 1,
                        dimX: i?.dimX ?? 0,
                        dimY: i?.dimY ?? 0,
                        dimZ: i?.dimZ ?? 0,
                        unitPrice: i?.unitPrice ?? 0,
                    })),
                },
            },
        });
        const origin = req.headers.get("origin") ?? "http://localhost:3000";
        const lineItems = buildStripeLineItems(items ?? [], tax ?? 0, shippingCost ?? 0, discount, couponCode ?? "");
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
        return NextResponse.json({ url: stripeSession.url, orderId: order.id, discount });
    }
    catch (err) {
        console.error("Checkout error:", err);
        return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
    }
}
