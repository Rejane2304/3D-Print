import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

function isAdmin(session: Session | null): boolean {
  return !!(session?.user && (session.user as { role?: string }).role === "admin");
}

/** PUT /api/admin/coupons/[id] */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const paramsObj = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await request.json();

    const coupon = await prisma.coupon.update({
      where: { id: paramsObj.id },
      data: {
        discountType: data.discountType,
        discountValue:
          typeof data.discountValue === "string" && data.discountValue.length > 0
            ? Number.parseFloat(data.discountValue)
            : undefined,
        minPurchase: (() => {
          if (data.minPurchase === undefined) return undefined;
          if (!data.minPurchase) return null;
          return Number.parseFloat(data.minPurchase);
        })(),
        maxUses: (() => {
          if (data.maxUses === undefined) return undefined;
          if (!data.maxUses) return null;
          return Number.parseInt(data.maxUses);
        })(),
        validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
        validUntil: (() => {
          if (data.validUntil === undefined) return undefined;
          if (!data.validUntil) return null;
          return new Date(data.validUntil);
        })(),
        isActive: data.isActive,
      },
    });

    return NextResponse.json(coupon);
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** DELETE /api/admin/coupons/[id] */
export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const paramsObj = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.coupon.delete({ where: { id: paramsObj.id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
