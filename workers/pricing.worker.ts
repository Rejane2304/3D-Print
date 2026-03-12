/**
 * pricing.worker.ts — Web Worker para cálculo de precios en background
 *
 * Calcula la matriz completa de precios (todos los productos × todos los materiales)
 * sin bloquear el hilo principal. Reporta progreso cada 5 ítems.
 *
 * Uso en Next.js (webpack 5):
 *   new Worker(new URL('../workers/pricing.worker.ts', import.meta.url))
 */

// ---- Motor de precios (autocontenido, sin imports externos) ----

const MACHINE_AMORTIZATION = 0.25; // $/h
const OPERATION_COST = 0.05; // $/h electricidad
const INFILL_FACTOR = 0.2;
const MARGINS = { unit: 2.5, medium: 2.0, bulk: 1.5 } as const;

interface MaterialInput {
  id: string;
  code: string;
  pricePerKg: number;
  maintenanceFactor: number;
  density: number;
}

interface ProductInput {
  id: string;
  defaultDimX: number;
  defaultDimY: number;
  defaultDimZ: number;
  density: number;
  printTimeMinutes: number;
  finishCost: number;
}

interface CalcResult {
  materialCost: number;
  machineCost: number;
  maintenanceCost: number;
  operationCost: number;
  baseCost: number;
  priceUnit: number;
  priceMedium: number;
  priceBulk: number;
}

function calcPrice(product: ProductInput, material: MaterialInput): CalcResult {
  const vol = (product.defaultDimX * product.defaultDimY * product.defaultDimZ) / 1000;
  const weightKg = (vol * material.density * INFILL_FACTOR) / 1000;
  const hours = product.printTimeMinutes / 60;

  const materialCost = weightKg * material.pricePerKg;
  const machineCost = hours * MACHINE_AMORTIZATION;
  const maintenanceCost = hours * material.maintenanceFactor;
  const operationCost = hours * OPERATION_COST;
  const baseCost =
    materialCost + machineCost + maintenanceCost + operationCost + product.finishCost;

  const r = (n: number) => Math.round(n * 100) / 100;
  return {
    materialCost: r(materialCost),
    machineCost: r(machineCost),
    maintenanceCost: r(maintenanceCost),
    operationCost: r(operationCost),
    baseCost: r(baseCost),
    priceUnit: r(baseCost * MARGINS.unit),
    priceMedium: r(baseCost * MARGINS.medium),
    priceBulk: r(baseCost * MARGINS.bulk),
  };
}

// ---- Listener de mensajes ----

self.onmessage = (event: MessageEvent) => {
  const { type, products, materials } = event.data as {
    type: string;
    products: ProductInput[];
    materials: MaterialInput[];
  };

  if (type !== "CALCULATE_PRICES") return;

  try {
    const total = products.length * materials.length;
    const prices: Record<string, Record<string, CalcResult>> = {};
    let processed = 0;

    for (const product of products) {
      prices[product.id] = {};
      for (const material of materials) {
        prices[product.id][material.id] = calcPrice(product, material);
        processed++;

        // Reportar progreso cada 5 cálculos
        if (processed % 5 === 0 || processed === total) {
          self.postMessage({
            type: "PROGRESS",
            current: processed,
            total,
            percentage: Math.round((processed / total) * 100),
          });
        }
      }
    }

    self.postMessage({ type: "RESULT", prices });
  } catch (error) {
    self.postMessage({
      type: "ERROR",
      message: error instanceof Error ? error.message : "Worker calculation failed",
    });
  }
};
