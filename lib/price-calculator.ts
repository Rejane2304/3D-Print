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
  /**
   * Factor de relleno por defecto (15 %).
   * Cada producto puede calibrar su propio valor desde el laminador:
   * modelFillFactor = pesoLaminador_g / (X × Y × Z / 1000 × densidad)
   */
  infillFactor: 0.15,
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
  weight: number;               // gramos estimados
  printTimeMinutes: number;     // tiempo de impresión escalado (min)
  materialCost: number;
  machineCost: number;
  maintenanceCost: number;
  operationCost: number;
  consumablesCost: number;
  finishCost: number;           // coste de acabado fijo
  baseCost: number;             // suma de todos los costes
  priceUnit: number;            // precio 1–4 uds. (×margen)
  priceMedium: number;          // precio 5–9 uds.
  priceBulk: number;            // precio 10+ uds.
  finalPrice: number;           // precio según quantity
}

// ---- Funciones core -----------------------------------------

/**
 * Calcula el peso en gramos a partir de dimensiones en mm.
 *
 * @param fillFactor  Factor de relleno calibrado desde el laminador.
 *   - Valor por defecto: PRICING_CONFIG.infillFactor (0.15)
 *   - Fórmula de calibración: peso_laminador_g / (X*Y*Z/1000 * densidad)
 *   - Ejemplo British Soldier (PLA, 56×56×140mm, 35.23 g):
 *       35.23 / (440 * 1.24) ≈ 0.0646
 */
export function calculateWeight(
  dimX: number,
  dimY: number,
  dimZ: number,
  density: number,
  fillFactor: number = PRICING_CONFIG.infillFactor
): number {
  const volumeCm3 = (dimX * dimY * dimZ) / 1000;
  return volumeCm3 * density * fillFactor;
}

/**
 * Escala el tiempo de impresión linealmente con el volumen relativo
 * respecto a las dimensiones de referencia del producto.
 *
 * Si no se proporcionan dimensiones de referencia, devuelve
 * basePrintTimeMinutes sin modificar.
 */
export function scalePrintTime(
  basePrintTimeMinutes: number,
  dimX: number,
  dimY: number,
  dimZ: number,
  refDimX: number,
  refDimY: number,
  refDimZ: number
): number {
  const refVol = refDimX * refDimY * refDimZ;
  if (refVol <= 0) return basePrintTimeMinutes;
  const volumeRatio = (dimX * dimY * dimZ) / refVol;
  // Escala lineal: la raíz cúbica del ratio de volúmenes equivale
  // al factor dimensional (ej. doble de lado → doble de tiempo, no 8×).
  const linearScale = Math.cbrt(volumeRatio);
  return Math.max(1, basePrintTimeMinutes * linearScale);
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
    printTimeMinutes: round(printTimeMinutes),
    materialCost: round(materialCost),
    machineCost: round(machineCost),
    maintenanceCost: round(maintenanceCost),
    operationCost: round(operationCost),
    consumablesCost: round(consumablesCost),
    finishCost: 0,
    baseCost: round(baseCost),
    priceUnit: round(priceUnit),
    priceMedium: round(priceMedium),
    priceBulk: round(priceBulk),
    finalPrice: round(finalPrice),
  };
}

/**
 * Calcula el precio a partir de dimensiones (mm) usando el motor avanzado.
 *
 * Incorpora:
 * - fillFactor por producto (calibrado desde el laminador Bambu)
 * - Escalado de tiempo de impresión con el volumen relativo
 * - Desglose completo de costes (incluyendo finishCost)
 *
 * @param options.fillFactor      Factor de relleno del modelo (default 0.15)
 * @param options.refDimX/Y/Z     Dimensiones de referencia en mm (para escalar printTime)
 */
export function calculatePriceFromDimensions(
  dimX: number,
  dimY: number,
  dimZ: number,
  basePrintTimeMinutes: number,
  material: MaterialConfig,
  options?: Readonly<{
    quantity?: number;
    finishCost?: number;
    fillFactor?: number;
    refDimX?: number;
    refDimY?: number;
    refDimZ?: number;
  }>
): PriceCalculation {
  const quantity   = options?.quantity   ?? 1;
  const finishCost = options?.finishCost ?? 0;
  const fillFactor = options?.fillFactor ?? PRICING_CONFIG.infillFactor;

  // Escalar tiempo de impresión con el volumen relativo a las dims de referencia
  const printTimeMinutes =
    options?.refDimX !== undefined &&
    options.refDimY !== undefined &&
    options.refDimZ !== undefined
      ? scalePrintTime(
          basePrintTimeMinutes,
          dimX, dimY, dimZ,
          options.refDimX, options.refDimY, options.refDimZ
        )
      : basePrintTimeMinutes;

  const weightGrams = calculateWeight(dimX, dimY, dimZ, material.density, fillFactor);
  const result = calculateAdvancedPrice(weightGrams, printTimeMinutes, material, quantity);

  // finishCost es un coste fijo (manipulación/acabado): se suma DESPUÉS del margen
  // para no multiplicarlo por 2.5× junto con los costes de producción.
  const margins = PRICING_CONFIG.margins;
  const priceUnit   = result.baseCost * margins.unit   + finishCost;
  const priceMedium = result.baseCost * margins.medium + finishCost;
  const priceBulk   = result.baseCost * margins.bulk   + finishCost;
  const finalPrice  = getPriceByQuantity(priceUnit, priceMedium, priceBulk, quantity);

  return {
    ...result,
    weight: round(weightGrams),
    printTimeMinutes: round(printTimeMinutes),
    finishCost: round(finishCost),
    baseCost: round(result.baseCost),
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
