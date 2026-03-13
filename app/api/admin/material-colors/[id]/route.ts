import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/db";

// PATCH y DELETE para la relación MaterialColor (Next.js 14+ app router)
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const data = await request.json();
  const materialColor = await prisma.materialColor.update({
    where: { id },
    data: {
      stock: data.stock,
      image: data.image || null,
    },
    include: { color: true },
  });
  return NextResponse.json(materialColor);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await prisma.materialColor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
