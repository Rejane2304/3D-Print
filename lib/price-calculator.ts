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

export function calculateWeight(dimX: number, dimY: number, dimZ: number, density: number): number {
  // dimX, dimY, dimZ se expresan en mm. Convertimos a cm³.
  const volumeCm3 = (dimX * dimY * dimZ) / 1000;
  const infillFactor = 0.2;
  return volumeCm3 * density * infillFactor;
}

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

export const MATERIAL_INFO = {
  PLA: {
    density: 1.24,
    basePricePerGram: 0.02,
    color: "#00FFFF",
    label: "PLA",
    properties: [
      { name: "Resistencia", value: "Media" },
      { name: "Flexibilidad", value: "Baja" },
      { name: "Temp. Impresión", value: "190-220°C" },
      { name: "Durabilidad", value: "Media" },
      { name: "Biodegradable", value: "Sí" },
    ],
    uses: "Prototipos, figuras decorativas, maquetas, objetos de bajo estrés mecánico",
  },
  PETG: {
    density: 1.27,
    basePricePerGram: 0.025,
    color: "#FFBF00",
    label: "PETG",
    properties: [
      { name: "Resistencia", value: "Alta" },
      { name: "Flexibilidad", value: "Media" },
      { name: "Temp. Impresión", value: "220-250°C" },
      { name: "Durabilidad", value: "Alta" },
      { name: "Biodegradable", value: "No" },
    ],
    uses: "Piezas mecánicas, contenedores, carcasas protectoras, piezas exteriores",
  },
} as const;
