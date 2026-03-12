// =============================================================
// Servicio de precios — isomórfico (server-side con Prisma)
// Persiste y recalcula la tabla ProductPrice en BD.
// Usar sólo en rutas API o en Componentes de servidor (accede a Prisma).
// =============================================================

import prisma from "./db";
import { calculateAdvancedPrice, PRICING_CONFIG } from "./price-calculator";

// ---- Leer configuración de precios desde BD (con fallback a constantes)

export async function getPricingConfig(): Promise<{
  machineAmortizationPerHour: number;
  operationCostPerHour: number;
  consumablesCostPerHour: number;
  margins: { unit: number; medium: number; bulk: number };
}> {
  const dbConfig = await prisma.pricingConfig.findFirst();
  if (dbConfig) {
    return {
      machineAmortizationPerHour: dbConfig.machineAmortizationPerHour,
      operationCostPerHour: dbConfig.operationCostPerHour,
      consumablesCostPerHour: dbConfig.consumablesCostPerHour,
      margins: {
        unit: dbConfig.marginUnit,
        medium: dbConfig.marginMedium,
        bulk: dbConfig.marginBulk,
      },
    };
  }
  return {
    machineAmortizationPerHour: PRICING_CONFIG.machineAmortizationPerHour,
    operationCostPerHour: PRICING_CONFIG.operationCostPerHour,
    consumablesCostPerHour: PRICING_CONFIG.consumablesCostPerHour,
    margins: {
      unit: PRICING_CONFIG.margins.unit,
      medium: PRICING_CONFIG.margins.medium,
      bulk: PRICING_CONFIG.margins.bulk,
    },
  };
}

// ---- Actualizar precios de un producto para todos los materiales

export async function updateProductPrices(productId: string): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error(`Product not found: ${productId}`);

  const materials = await prisma.material.findMany({
    where: { inStock: true },
  });
  const config = await getPricingConfig();

  for (const mat of materials) {
    const calc = calculateAdvancedPrice(
      // Calcular peso a partir de dimensiones default si no hay peso explícito
      getDefaultWeight(product),
      product.printTimeMinutes,
      {
        pricePerKg: mat.pricePerKg,
        density: mat.density,
        maintenanceFactor: mat.maintenanceFactor,
      },
      1,
      config
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
    orderBy: { material: { code: "asc" } },
  });
}

// ---- Ayudantes privados ----------------------------------------

/**
 * Calcula el peso en gramos a partir de las dimensiones por defecto del producto.
 * Usa el modelFillFactor calibrado desde el laminador (fallback: 0.15).
 */
function getDefaultWeight(
  product: Readonly<{
    defaultDimX: number;
    defaultDimY: number;
    defaultDimZ: number;
    density: number;
    modelFillFactor?: number;
  }>
): number {
  const volumeCm3 = (product.defaultDimX * product.defaultDimY * product.defaultDimZ) / 1000;
  const fillFactor = product.modelFillFactor ?? 0.15;
  return volumeCm3 * product.density * fillFactor;
}
