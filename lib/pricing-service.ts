// =============================================================
// Pricing Service — isomórfico (server-side con Prisma)
// Persiste y recalcula la tabla ProductPrice en BD.
// Usar sólo en API routes / Server Components (accede a Prisma).
// =============================================================

import { prisma } from '@/lib/db';
import { calculateAdvancedPrice } from '@/lib/price-calculator';
import type { PriceCalculation } from '@/lib/price-calculator';

export type { PriceCalculation };

// ---- Actualizar precios de un producto para todos los materiales

export async function updateProductPrices(productId: string): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error(`Product not found: ${productId}`);

  const materials = await prisma.material.findMany({ where: { inStock: true } });

  for (const mat of materials) {
    const calc = calculateAdvancedPrice(
      // Calcular peso a partir de dimensiones default si no hay peso explícito
      getDefaultWeight(product),
      product.printTimeMinutes,
      {
        pricePerKg: mat.pricePerKg,
        density: mat.density,
        maintenanceFactor: mat.maintenanceFactor,
      }
    );

    await prisma.productPrice.upsert({
      where: { productId_materialId: { productId, materialId: mat.id } },
      update: {
        materialCost: calc.materialCost,
        machineCost: calc.machineCost,
        maintenanceCost: calc.maintenanceCost,
        operationCost: calc.operationCost,
        baseCost: calc.baseCost,
        priceUnit: calc.priceUnit,
        priceMedium: calc.priceMedium,
        priceBulk: calc.priceBulk,
        calculatedAt: new Date(),
      },
      create: {
        productId,
        materialId: mat.id,
        materialCost: calc.materialCost,
        machineCost: calc.machineCost,
        maintenanceCost: calc.maintenanceCost,
        operationCost: calc.operationCost,
        baseCost: calc.baseCost,
        priceUnit: calc.priceUnit,
        priceMedium: calc.priceMedium,
        priceBulk: calc.priceBulk,
      },
    });
  }
}

// ---- Recalcular precios de TODOS los productos activos

export async function updateAllProductPrices(): Promise<{ updated: number }> {
  const products = await prisma.product.findMany({ where: { isActive: true } });
  let updated = 0;
  for (const p of products) {
    await updateProductPrices(p.id);
    updated++;
  }
  return { updated };
}

// ---- Obtener precios de un producto para todos los materiales

export async function getProductPrices(productId: string) {
  return prisma.productPrice.findMany({
    where: { productId },
    include: { material: true },
    orderBy: { material: { code: 'asc' } },
  });
}

// ---- Helpers privados ----------------------------------------

/**
 * Calcula el peso en gramos a partir de las dimensiones por defecto del producto.
 * Usa el mismo factor de infill del motor (20 %).
 */
function getDefaultWeight(product: {
  defaultDimX: number;
  defaultDimY: number;
  defaultDimZ: number;
  density: number;
}): number {
  const volumeCm3 = (product.defaultDimX * product.defaultDimY * product.defaultDimZ) / 1000;
  return volumeCm3 * product.density * 0.2;
}
