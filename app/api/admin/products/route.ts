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
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || '10');
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
        basePricePerGram: Number.parseFloat(data.basePricePerGram),
        density: Number.parseFloat(data.density),
        minDimX: Number.parseFloat(data.minDimX || '10'),
        minDimY: Number.parseFloat(data.minDimY || '10'),
        minDimZ: Number.parseFloat(data.minDimZ || '10'),
        maxDimX: Number.parseFloat(data.maxDimX || '300'),
        maxDimY: Number.parseFloat(data.maxDimY || '300'),
        maxDimZ: Number.parseFloat(data.maxDimZ || '300'),
        defaultDimX: Number.parseFloat(data.defaultDimX || '50'),
        defaultDimY: Number.parseFloat(data.defaultDimY || '50'),
        defaultDimZ: Number.parseFloat(data.defaultDimZ || '50'),
        finishCost: Number.parseFloat(data.finishCost || '2.50'),
        printTimeMinutes: Number.parseInt(data.printTimeMinutes || '60'),
        modelFillFactor: Number.parseFloat(data.modelFillFactor || '0.15'),
        images: data.images || [],
        colors: data.colors || ['#FFFFFF'],
        featured: data.featured || false,
        stock: Number.parseInt(data.stock || '100'),
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
