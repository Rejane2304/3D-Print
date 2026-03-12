import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET: Listar todos los colores de un material
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const materialId = searchParams.get("materialId");
  if (!materialId) {
    return NextResponse.json({ error: "materialId requerido" }, { status: 400 });
  }
  const materialColors = await prisma.materialColor.findMany({
    where: { materialId },
    include: { color: true },
    orderBy: { color: { name: "asc" } },
  });
  return NextResponse.json(materialColors);
}

// POST: Asociar color a material
export async function POST(req: Request) {
  const data = await req.json();
  if (!data.materialId || !data.colorId) {
    return NextResponse.json({ error: "materialId y colorId requeridos" }, { status: 400 });
  }
  const materialColor = await prisma.materialColor.create({
    data: {
      materialId: data.materialId,
      colorId: data.colorId,
      stock: data.stock || 0,
      image: data.image || null,
    },
    include: { color: true },
  });
  return NextResponse.json(materialColor);
}
