import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';
import { updateAllProductPrices } from '@/lib/pricing-service';
export const dynamic = 'force-dynamic';
const NUMERIC_FIELDS = [
    'machineAmortizationPerHour',
    'operationCostPerHour',
    'consumablesCostPerHour',
    'marginUnit',
    'marginMedium',
    'marginBulk',
];
/** GET /api/admin/pricing — Obtener configuración de precios */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const config = await prisma.pricingConfig.findFirst();
        if (config) {
            return NextResponse.json(config);
        }
        // Crear configuración por defecto si no existe
        const defaultConfig = await prisma.pricingConfig.create({ data: {} });
        return NextResponse.json(defaultConfig);
    }
    catch (error) {
        console.error('Error fetching pricing config:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
/** PUT /api/admin/pricing — Actualizar configuración de precios */
export async function PUT(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const updateData = {};
        for (const field of NUMERIC_FIELDS) {
            const raw = body[field];
            if (raw === undefined)
                continue;
            if (typeof raw !== 'number' && typeof raw !== 'string') {
                return NextResponse.json({ error: `Invalid value for ${field}: must be a number` }, { status: 400 });
            }
            const num = Number.parseFloat(String(raw));
            if (!Number.isFinite(num) || num <= 0) {
                return NextResponse.json({ error: `Invalid value for ${field}: must be a positive number` }, { status: 400 });
            }
            updateData[field] = num;
        }
        const existing = await prisma.pricingConfig.findFirst();
        let config;
        if (existing) {
            config = await prisma.pricingConfig.update({
                where: { id: existing.id },
                data: updateData,
            });
        }
        else {
            config = await prisma.pricingConfig.create({ data: updateData });
        }
        // Recalcular precios en background (no bloquear la respuesta)
        updateAllProductPrices().catch((err) => console.error('Error recalculating prices after config update:', err));
        return NextResponse.json(config);
    }
    catch (error) {
        console.error('Error updating pricing config:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
