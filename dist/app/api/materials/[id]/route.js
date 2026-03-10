import { NextResponse } from "next/server";
import prisma from "@/lib/db";
export const dynamic = "force-dynamic";
/** GET /api/materials/[id] — Detalle de material (público) */
export async function GET(_req, { params }) {
  try {
    const material = await prisma.material.findUnique({
      where: { id: params.id },
      include: { inventory: true },
    });
    if (!material)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(material);
  } catch (error) {
    console.error("Error fetching material:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
