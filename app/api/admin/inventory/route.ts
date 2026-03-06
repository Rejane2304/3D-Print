import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

import type { Session } from 'next-auth';

export const dynamic = 'force-dynamic';

function isAdmin(session: Session | null): boolean {
  return !!(session?.user && (session.user as { role?: string }).role === 'admin');
}

/** GET /api/admin/inventory — Stock por material */
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const inventory = await prisma.inventory.findMany({
      include: { material: true },
      orderBy: { material: { code: 'asc' } },
    });

    const withAlerts = inventory.map((item) => ({
      ...item,
      lowStock: item.quantity <= item.minStock,
    }));

    return NextResponse.json(withAlerts);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** PUT /api/admin/inventory — Upsert stock de un material */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();

    if (!data.materialId) {
      return NextResponse.json({ error: 'materialId is required' }, { status: 400 });
    }

    const inventory = await prisma.inventory.upsert({
      where: { materialId: data.materialId },
      update: {
        quantity: parseFloat(data.quantity),
        minStock: data.minStock !== undefined ? parseFloat(data.minStock) : undefined,
        location: data.location,
        lastRefill: data.refill ? new Date() : undefined,
      },
      create: {
        materialId: data.materialId,
        quantity: parseFloat(data.quantity),
        minStock: data.minStock ? parseFloat(data.minStock) : 500,
        location: data.location ?? null,
      },
      include: { material: true },
    });

    return NextResponse.json(inventory);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
