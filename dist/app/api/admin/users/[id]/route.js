import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { id } = await params;
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                address: true,
                city: true,
                state: true,
                zipCode: true,
                country: true,
                loyaltyPoints: true,
                createdAt: true,
                orders: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: { items: true },
                },
            },
        });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json(user);
    }
    catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { id } = await params;
        const { role, loyaltyPoints } = await request.json();
        const user = await prisma.user.update({
            where: { id },
            data: {
                ...(role && { role }),
                ...(loyaltyPoints !== undefined && { loyaltyPoints: parseInt(loyaltyPoints) }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                loyaltyPoints: true,
            },
        });
        return NextResponse.json(user);
    }
    catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
