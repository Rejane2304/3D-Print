import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';
import { updateAllProductPrices } from '@/lib/pricing-service';

import type { Session } from 'next-auth';

export const dynamic = 'force-dynamic';

function isAdmin(session: Session | null): boolean {
  return !!(session?.user && (session.user as { role?: string }).role === 'admin');
}

/** GET /api/admin/materials/[id] */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const material = await prisma.material.findUnique({
      where: { id: params.id },
      include: { inventory: true },
    });
    if (!material) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(material);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** PUT /api/admin/materials/[id] — Actualizar material y recalcular precios */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();

    const material = await prisma.material.update({
      where: { id: params.id },
      data: {
        name: data.name,
        pricePerKg: data.pricePerKg !== undefined ? parseFloat(data.pricePerKg) : undefined,
        maintenanceFactor: data.maintenanceFactor !== undefined ? parseFloat(data.maintenanceFactor) : undefined,
        density: data.density !== undefined ? parseFloat(data.density) : undefined,
        description: data.description,
        color: data.color,
        inStock: data.inStock,
      },
    });

    // Recalcular precios en background (no bloquear la respuesta)
    updateAllProductPrices().catch((err: unknown) =>
      console.error('Error recalculating prices after material update:', err)
    );

    return NextResponse.json(material);
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** DELETE /api/admin/materials/[id] */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.material.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
