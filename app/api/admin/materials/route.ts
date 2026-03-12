import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

function isAdmin(session: Session | null): boolean {
  return !!(session?.user && (session.user as { role?: string }).role === "admin");
}

/** GET /api/admin/materials — Todos los materiales */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const materials = await prisma.material.findMany({
      include: { inventory: true },
      orderBy: { code: "asc" },
    });
    return NextResponse.json(materials);
  } catch (error) {
    console.error("Error fetching materials:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** POST /api/admin/materials — Crear material */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await request.json();

    const material = await prisma.material.create({
      data: {
        name: data.name,
        code: String(data.code).toUpperCase(),
        pricePerKg: Number.parseFloat(data.pricePerKg),
        maintenanceFactor: Number.parseFloat(data.maintenanceFactor),
        density: Number.parseFloat(data.density),
        description: data.description ?? null,
        inStock: data.inStock ?? true,
      },
    });

    return NextResponse.json(material, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Material code already exists" }, { status: 409 });
    }
    console.error("Error creating material:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
