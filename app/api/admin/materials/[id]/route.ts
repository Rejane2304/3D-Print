import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";
import { updateAllProductPrices } from "@/lib/pricing-service";

import type { Session } from "next-auth";

export const dynamic = "force-dynamic";

function isAdmin(session: Session | null): boolean {
  return !!(
    session?.user && (session.user as { role?: string }).role === "admin"
  );
}

/** GET /api/admin/materials/[id] */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const paramsObj = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const material = await prisma.material.findUnique({
      where: { id: paramsObj.id },
      include: { inventory: true },
    });
    if (!material)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(material);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** PUT /api/admin/materials/[id] — Actualizar material y recalcular precios */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const paramsObj = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await request.json();

    const material = await prisma.material.update({
      where: { id: paramsObj.id },
      data: {
        name: typeof data.name === "string" ? data.name : undefined,
        pricePerKg:
          typeof data.pricePerKg === "string" && data.pricePerKg.length > 0
            ? Number.parseFloat(data.pricePerKg)
            : undefined,
        maintenanceFactor:
          typeof data.maintenanceFactor === "string" &&
          data.maintenanceFactor.length > 0
            ? Number.parseFloat(data.maintenanceFactor)
            : undefined,
        density:
          typeof data.density === "string" && data.density.length > 0
            ? Number.parseFloat(data.density)
            : undefined,
        description:
          typeof data.description === "string" ? data.description : undefined,
        inStock: typeof data.inStock === "boolean" ? data.inStock : undefined,
      },
    });

    // Recalcular precios en background (no bloquear la respuesta)
    updateAllProductPrices().catch((err: unknown) =>
      console.error("Error recalculating prices after material update:", err),
    );

    return NextResponse.json(material);
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 },
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** DELETE /api/admin/materials/[id] */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const paramsObj = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.material.delete({ where: { id: paramsObj.id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 },
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
