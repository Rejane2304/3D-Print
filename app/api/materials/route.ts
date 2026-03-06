import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

/** GET /api/materials — Catálogo de materiales (público) */
export async function GET() {
  try {
    const materials = await prisma.material.findMany({
      where: { inStock: true },
      orderBy: { code: 'asc' },
    });
    return NextResponse.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
