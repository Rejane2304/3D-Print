import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        material: data.material,
        basePricePerGram: parseFloat(data.basePricePerGram),
        density: parseFloat(data.density),
        minDimX: parseFloat(data.minDimX),
        minDimY: parseFloat(data.minDimY),
        minDimZ: parseFloat(data.minDimZ),
        maxDimX: parseFloat(data.maxDimX),
        maxDimY: parseFloat(data.maxDimY),
        maxDimZ: parseFloat(data.maxDimZ),
        defaultDimX: parseFloat(data.defaultDimX),
        defaultDimY: parseFloat(data.defaultDimY),
        defaultDimZ: parseFloat(data.defaultDimZ),
        finishCost: parseFloat(data.finishCost),
        printTimeMinutes: parseInt(data.printTimeMinutes || '60'),
        modelFillFactor: parseFloat(data.modelFillFactor || '0.15'),
        images: data.images,
        colors: data.colors,
        featured: data.featured,
        stock: parseInt(data.stock),
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
