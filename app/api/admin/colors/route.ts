import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET: Listar todos los colores
export async function GET() {
  const colors = await prisma.color.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(colors);
}

// POST: Crear un nuevo color
export async function POST(req: Request) {
  const data = await req.json();
  try {
    const color = await prisma.color.create({
      data: {
        name: data.name,
        code: data.code,
        hex: data.hex,
        image: data.image || null,
      },
    });
    return NextResponse.json(color);
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Ya existe un color con este código" }, { status: 409 });
    }
    throw error;
  }
}
