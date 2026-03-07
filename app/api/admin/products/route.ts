import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { category: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        material: data.material,
        basePricePerGram: parseFloat(data.basePricePerGram),
        density: parseFloat(data.density),
        minDimX: parseFloat(data.minDimX || '10'),
        minDimY: parseFloat(data.minDimY || '10'),
        minDimZ: parseFloat(data.minDimZ || '10'),
        maxDimX: parseFloat(data.maxDimX || '300'),
        maxDimY: parseFloat(data.maxDimY || '300'),
        maxDimZ: parseFloat(data.maxDimZ || '300'),
        defaultDimX: parseFloat(data.defaultDimX || '50'),
        defaultDimY: parseFloat(data.defaultDimY || '50'),
        defaultDimZ: parseFloat(data.defaultDimZ || '50'),
        finishCost: parseFloat(data.finishCost || '2.50'),
        printTimeMinutes: parseInt(data.printTimeMinutes || '60'),
        modelFillFactor: parseFloat(data.modelFillFactor || '0.15'),
        images: data.images || [],
        colors: data.colors || ['#FFFFFF'],
        featured: data.featured || false,
        stock: parseInt(data.stock || '100'),
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
