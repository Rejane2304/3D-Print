// =============================================================
// Motor de precios unificado — Bambu Lab P2S
// Combina la lógica original (dimensiones→peso→precio) con el
// motor avanzado del p2s-pricing-system (amortización de máquina,
// mantenimiento, electricidad, precios escalonados por volumen).
// =============================================================

// ---- Configuración del motor --------------------------------

export const PRICING_CONFIG = {
  /** Amortización: P2S ~€750 / 6000 h vida útil (mercado ES, 2025) */
  machineAmortizationPerHour: 0.12,
  /** Electricidad: 150 W × €0.27/kWh (tarifa media ES, 2025) */
  operationCostPerHour: 0.04,
  /** Consumibles: boquilla E6 / ~300h + lubricación ≈ €0.02/h */
  consumablesCostPerHour: 0.02,
  /** Factor de relleno estándar: 20 % infill */
  infillFactor: 0.2,
  margins: {
    unit: 2.5,   // ×250% para 1–4 uds.
    medium: 2,   // ×200% para 5–9 uds.
    bulk: 1.5,   // ×150% para 10+ uds.
  },
} as const;

// ---- Interfaces públicas ------------------------------------

export interface MaterialConfig {
  pricePerKg: number;
  density: number;
  maintenanceFactor: number;
}

export interface PriceCalculation {
  weight: number;          // gramos
  materialCost: number;
  machineCost: number;
  maintenanceCost: number;
  operationCost: number;
  consumablesCost: number;
  baseCost: number;
  priceUnit: number;    // precio 1–4 uds.
  priceMedium: number;  // precio 5–9 uds.
  priceBulk: number;    // precio 10+ uds.
  finalPrice: number;   // precio según quantity
}

/** Configuración legacy para compatibilidad con código existente */
export interface PriceConfig {
  material: string;
  dimX: number;
  dimY: number;
  dimZ: number;
  quantity: number;
  basePricePerGram: number;
  density: number;
  finishCost: number;
}

// ---- Funciones core -----------------------------------------

/**
 * Calcula el peso en gramos a partir de dimensiones en mm.
 * Usa infill del 20 % como estándar.
 */
export function calculateWeight(
  dimX: number,
  dimY: number,
  dimZ: number,
  density: number
): number {
  const volumeCm3 = (dimX * dimY * dimZ) / 1000;
  return volumeCm3 * density * PRICING_CONFIG.infillFactor;
}

/**
 * Motor de precios avanzado: incluye amortización de máquina,
 * mantenimiento por material y coste de operación (electricidad).
 */
export function calculateAdvancedPrice(
  weightGrams: number,
  printTimeMinutes: number,
  material: MaterialConfig,
  quantity: number = 1,
  config?: Readonly<{
    machineAmortizationPerHour?: number;
    operationCostPerHour?: number;
    consumablesCostPerHour?: number;
    margins?: Readonly<{ unit: number; medium: number; bulk: number }>;
  }>
): PriceCalculation {
  const printTimeHours = printTimeMinutes / 60;
  const weightKg = weightGrams / 1000;

  const machineAmortizationPerHour =
    config?.machineAmortizationPerHour ?? PRICING_CONFIG.machineAmortizationPerHour;
  const operationCostPerHour =
    config?.operationCostPerHour ?? PRICING_CONFIG.operationCostPerHour;
  const consumablesCostPerHour =
    config?.consumablesCostPerHour ?? PRICING_CONFIG.consumablesCostPerHour;
  const margins = config?.margins ?? PRICING_CONFIG.margins;

  const materialCost = weightKg * material.pricePerKg;
  const machineCost = printTimeHours * machineAmortizationPerHour;
  const maintenanceCost = printTimeHours * material.maintenanceFactor;
  const operationCost = printTimeHours * operationCostPerHour;
  const consumablesCost = printTimeHours * consumablesCostPerHour;
  const baseCost = materialCost + machineCost + maintenanceCost + operationCost + consumablesCost;

  const priceUnit = baseCost * margins.unit;
  const priceMedium = baseCost * margins.medium;
  const priceBulk = baseCost * margins.bulk;

  const finalPrice = getPriceByQuantity(priceUnit, priceMedium, priceBulk, quantity);

  return {
    weight: round(weightGrams),
    materialCost: round(materialCost),
    machineCost: round(machineCost),
    maintenanceCost: round(maintenanceCost),
    operationCost: round(operationCost),
    consumablesCost: round(consumablesCost),
    baseCost: round(baseCost),
    priceUnit: round(priceUnit),
    priceMedium: round(priceMedium),
    priceBulk: round(priceBulk),
    finalPrice: round(finalPrice),
  };
}

/**
 * Calcula el precio a partir de dimensiones (mm) usando el motor avanzado.
 * Combina calculateWeight + calculateAdvancedPrice en una sola llamada.
 */
export function calculatePriceFromDimensions(
  dimX: number,
  dimY: number,
  dimZ: number,
  printTimeMinutes: number,
  material: MaterialConfig,
  quantity: number = 1,
  finishCost: number = 0
): PriceCalculation {
  const weightGrams = calculateWeight(dimX, dimY, dimZ, material.density);
  const result = calculateAdvancedPrice(weightGrams, printTimeMinutes, material, quantity);
  // Añadir finishCost al baseCost y recalcular precios finales
  const adjustedBase = result.baseCost + finishCost;
  const priceUnit = adjustedBase * PRICING_CONFIG.margins.unit;
  const priceMedium = adjustedBase * PRICING_CONFIG.margins.medium;
  const priceBulk = adjustedBase * PRICING_CONFIG.margins.bulk;
  const finalPrice = getPriceByQuantity(priceUnit, priceMedium, priceBulk, quantity);
  return {
    ...result,
    weight: round(weightGrams),
    baseCost: round(adjustedBase),
    priceUnit: round(priceUnit),
    priceMedium: round(priceMedium),
    priceBulk: round(priceBulk),
    finalPrice: round(finalPrice),
  };
}

/**
 * Devuelve el precio correcto según la cantidad solicitada.
 * < 5 uds → priceUnit | 5–9 → priceMedium | 10+ → priceBulk
 */
export function getPriceByQuantity(
  priceUnit: number,
  priceMedium: number,
  priceBulk: number,
  quantity: number
): number {
  if (quantity >= 10) return priceBulk;
  if (quantity >= 5) return priceMedium;
  return priceUnit;
}

// ---- API legacy (compatibilidad total con código existente) --

/**
 * @deprecated Usar calculatePriceFromDimensions para el motor completo.
 * Se mantiene para no romper el código existente.
 */
export function calculatePrice(config: PriceConfig): {
  weight: number;
  materialCost: number;
  finishCost: number;
  subtotal: number;
  total: number;
} {
  const weight = calculateWeight(config.dimX, config.dimY, config.dimZ, config.density);
  const materialCost = config.basePricePerGram * weight;
  const finishCost = config.finishCost;
  const subtotal = materialCost + finishCost;
  const total = subtotal * config.quantity;
  return { weight, materialCost, finishCost, subtotal, total };
}

// ---- Datos de materiales (mantenidos para UI sin BD) ---------

export const MATERIAL_INFO: Record<string, MaterialConfig & {
  code: string;
  label: string;
  color: string;
  properties: ReadonlyArray<{ readonly name: string; readonly value: string }>;
  uses: string;
  basePricePerGram: number;
}> = {
  PLA: {
    code: 'PLA',
    label: 'PLA Basic',
    density: 1.24,
    pricePerKg: 18,
    basePricePerGram: 0.018,
    maintenanceFactor: 0.03,
    color: '#00FFFF',
    properties: [
      { name: 'Resistencia', value: 'Media' },
      { name: 'Flexibilidad', value: 'Baja' },
      { name: 'Temp. Impresión', value: '190–220°C' },
      { name: 'Durabilidad', value: 'Media' },
      { name: 'Biodegradable', value: 'Sí' },
    ],
    uses: 'Prototipos, figuras decorativas, maquetas, objetos de bajo estrés mecánico',
  },
  PETG: {
    code: 'PETG',
    label: 'PETG Basic',
    density: 1.27,
    pricePerKg: 23,
    basePricePerGram: 0.023,
    maintenanceFactor: 0.04,
    color: '#FFBF00',
    properties: [
      { name: 'Resistencia', value: 'Alta' },
      { name: 'Flexibilidad', value: 'Media' },
      { name: 'Temp. Impresión', value: '220–250°C' },
      { name: 'Durabilidad', value: 'Alta' },
      { name: 'Biodegradable', value: 'No' },
    ],
    uses: 'Piezas mecánicas, contenedores, carcasas protectoras, piezas exteriores',
  },
  ASA: {
    code: 'ASA',
    label: 'ASA',
    density: 1.07,
    pricePerKg: 30,
    basePricePerGram: 0.03,
    maintenanceFactor: 0.05,
    color: '#FF6B35',
    properties: [
      { name: 'Resistencia', value: 'Alta' },
      { name: 'Flexibilidad', value: 'Baja' },
      { name: 'Temp. Impresión', value: '230–260°C' },
      { name: 'Durabilidad', value: 'Muy Alta' },
      { name: 'UV Resistente', value: 'Sí' },
    ],
    uses: 'Piezas exteriores, automoción, aplicaciones industriales',
  },
  TPU: {
    code: 'TPU',
    label: 'TPU Flexible',
    density: 1.21,
    pricePerKg: 35,
    basePricePerGram: 0.035,
    maintenanceFactor: 0.06,
    color: '#A855F7',
    properties: [
      { name: 'Resistencia', value: 'Media' },
      { name: 'Flexibilidad', value: 'Muy Alta' },
      { name: 'Temp. Impresión', value: '210–240°C' },
      { name: 'Durabilidad', value: 'Alta' },
      { name: 'Abrasión', value: 'Muy Alta' },
    ],
    uses: 'Juntas, fundas, rodillos, piezas que requieren flexibilidad',
  },
} as const;

// ---- Helpers privados ----------------------------------------

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
