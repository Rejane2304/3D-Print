import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";

// GET, PATCH, DELETE para un color específico (Next.js 14+ app router)
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const color = await prisma.color.findUnique({
    where: { id },
  });
  if (!color) return NextResponse.json({ error: "Color no encontrado" }, { status: 404 });
  return NextResponse.json(color);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const data = await request.json();
  const color = await prisma.color.update({
    where: { id },
    data: {
      name: data.name,
      code: data.code,
      hex: data.hex,
      image: data.image || null,
    },
  });
  return NextResponse.json(color);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await prisma.color.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
