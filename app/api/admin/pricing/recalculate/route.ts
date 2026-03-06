import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { updateAllProductPrices } from '@/lib/pricing-service';

export const dynamic = 'force-dynamic';

/** POST /api/admin/pricing/recalculate — Recalcular precios de todos los productos */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await updateAllProductPrices();
    return NextResponse.json({ success: true, updated: result.updated });
  } catch (error) {
    console.error('Error recalculating prices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
