import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Get total revenue
        const orders = await prisma.order.findMany({
            where: { status: { not: 'cancelled' } },
            select: { total: true, status: true, createdAt: true },
        });
        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        // Get counts
        const [totalOrders, totalProducts, totalUsers] = await Promise.all([
            prisma.order.count(),
            prisma.product.count(),
            prisma.user.count(),
        ]);
        // Get recent orders
        const recentOrders = await prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true, email: true } },
                items: true,
            },
        });
        // Get top products by sales
        const orderItems = await prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5,
        });
        const topProductIds = orderItems.map((item) => item.productId);
        const topProductsData = await prisma.product.findMany({
            where: { id: { in: topProductIds } },
        });
        const topProducts = orderItems.map((item) => ({
            product: topProductsData.find((p) => p.id === item.productId),
            totalSold: item._sum.quantity || 0,
        }));
        // Revenue by month (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const revenueByMonth = orders
            .filter((order) => order.createdAt >= sixMonthsAgo)
            .reduce((acc, order) => {
            const month = order.createdAt.toISOString().slice(0, 7);
            acc[month] = (acc[month] || 0) + order.total;
            return acc;
        }, {});
        // Orders by status
        const ordersByStatus = await prisma.order.groupBy({
            by: ['status'],
            _count: true,
        });
        // Cost by material (average unit price across order items)
        const itemsForCost = await prisma.orderItem.groupBy({
            by: ['material'],
            _avg: { unitPrice: true },
            _sum: { quantity: true },
        });
        const totalPieces = itemsForCost.reduce((sum, item) => sum + (item._sum.quantity || 0), 0) || 1;
        const costByMaterial = itemsForCost.map((item) => ({
            material: item.material,
            averageUnitPrice: item._avg.unitPrice || 0,
            pieces: item._sum.quantity || 0,
            percentage: ((item._sum.quantity || 0) / totalPieces) * 100,
        }));
        // Size distribution (based on longest dimension of each order item)
        const allItems = await prisma.orderItem.findMany({
            select: { dimX: true, dimY: true, dimZ: true },
        });
        const buckets = {
            '0-5 cm': 0,
            '5-10 cm': 0,
            '10-15 cm': 0,
            '15-20 cm': 0,
            '20-25 cm': 0,
            '25+ cm': 0,
        };
        allItems.forEach((item) => {
            // Altura Z almacenada en mm → convertir a cm
            const zCm = item.dimZ / 10;
            if (zCm <= 5)
                buckets['0-5 cm'] += 1;
            else if (zCm <= 10)
                buckets['5-10 cm'] += 1;
            else if (zCm <= 15)
                buckets['10-15 cm'] += 1;
            else if (zCm <= 20)
                buckets['15-20 cm'] += 1;
            else if (zCm <= 25)
                buckets['20-25 cm'] += 1;
            else
                buckets['25+ cm'] += 1;
        });
        return NextResponse.json({
            totalRevenue,
            totalOrders,
            totalProducts,
            totalUsers,
            recentOrders,
            topProducts,
            revenueByMonth: Object.entries(revenueByMonth).map(([month, revenue]) => ({
                month,
                revenue,
            })),
            ordersByStatus: ordersByStatus.map((item) => ({
                status: item.status,
                count: item._count,
            })),
            costByMaterial,
            sizeDistribution: Object.entries(buckets).map(([bucket, count]) => ({
                bucket,
                count,
            })),
        });
    }
    catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
