import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '5');

    if (query.length < 2) {
      return NextResponse.json([]);
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        name: true,
        category: true,
        material: true,
        basePricePerGram: true,
        images: true,
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
