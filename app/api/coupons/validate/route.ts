import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/coupons/validate
 * Body: { code: string; subtotal: number }
 * Valida si un cupón existe, está activo, dentro de su vigencia y no agotado.
 * No incrementa usedCount (eso ocurre al completar el pago en el webhook).
 */
export async function POST(request: NextRequest) {
  try {
    const { code, subtotal = 0 } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: String(code).toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json(
        { valid: false, error: "Coupon not found or inactive" },
        { status: 200 },
      );
    }

    const now = new Date();
    if (coupon.validUntil && coupon.validUntil < now) {
      return NextResponse.json(
        { valid: false, error: "Coupon has expired" },
        { status: 200 },
      );
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        { valid: false, error: "Coupon usage limit reached" },
        { status: 200 },
      );
    }

    if (coupon.minPurchase !== null && subtotal < coupon.minPurchase) {
      return NextResponse.json(
        {
          valid: false,
          error: `Minimum purchase of €${coupon.minPurchase.toFixed(2)} required`,
        },
        { status: 200 },
      );
    }

    const discount =
      coupon.discountType === "percentage"
        ? (subtotal * coupon.discountValue) / 100
        : coupon.discountValue;

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discount: Math.round(discount * 100) / 100,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
