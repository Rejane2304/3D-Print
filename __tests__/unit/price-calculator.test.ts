import { describe, it, expect } from 'vitest';
import { calculateWeight, calculatePriceFromDimensions, MATERIAL_INFO, PRICING_CONFIG } from '@/lib/price-calculator';

describe('Price Calculator', () => {
    describe('Flujo completo: peso impacta en precio', () => {
      it('el precio debe aumentar proporcionalmente al peso', () => {
        const material = {
          pricePerKg: MATERIAL_INFO.PLA.pricePerKg,
          density: MATERIAL_INFO.PLA.density,
          maintenanceFactor: MATERIAL_INFO.PLA.maintenanceFactor,
        };
        // Producto pequeño
        const resultSmall = calculatePriceFromDimensions(50, 50, 50, 60, material);
        // Producto mediano
        const resultMedium = calculatePriceFromDimensions(100, 100, 100, 60, material);
        // Producto grande
        const resultLarge = calculatePriceFromDimensions(200, 200, 200, 60, material);

        // El peso debe aumentar
        expect(resultSmall.weight).toBeLessThan(resultMedium.weight);
        expect(resultMedium.weight).toBeLessThan(resultLarge.weight);

        // El precio final debe aumentar proporcionalmente
        expect(resultSmall.finalPrice).toBeLessThan(resultMedium.finalPrice);
        expect(resultMedium.finalPrice).toBeLessThan(resultLarge.finalPrice);

        // El coste de material debe ser el factor dominante en el precio base
        const baseCostSmall = resultSmall.baseCost;
        const baseCostMedium = resultMedium.baseCost;
        const baseCostLarge = resultLarge.baseCost;
        expect(baseCostSmall).toBeLessThan(baseCostMedium);
        expect(baseCostMedium).toBeLessThan(baseCostLarge);
        // El materialCost debe ser al menos el 40% del baseCost para productos grandes
        expect(resultLarge.materialCost / baseCostLarge).toBeGreaterThan(0.4);
      });
    });
  describe('calculateWeight', () => {
    it('should calculate weight for PLA material', () => {
      // Dimensions in mm, volume converted to cm³ internally
      const weight = calculateWeight(100, 100, 100, MATERIAL_INFO.PLA.density);
      // Volume: 1000cm³ (100*100*100/1000), density: 1.24, infill: PRICING_CONFIG.infillFactor
      expect(weight).toBeCloseTo(1000 * 1.24 * PRICING_CONFIG.infillFactor, 1);
    });

    it('should calculate weight for PETG material', () => {
      const weight = calculateWeight(50, 50, 50, MATERIAL_INFO.PETG.density);
      // Volume: 125cm³ (50*50*50/1000), density: 1.27, infill: PRICING_CONFIG.infillFactor
      expect(weight).toBeCloseTo(125 * 1.27 * PRICING_CONFIG.infillFactor, 1);
    });

    it('should handle zero dimensions', () => {
      const weight = calculateWeight(0, 100, 100, MATERIAL_INFO.PLA.density);
      expect(weight).toBe(0);
    });
  });

  describe('calculatePriceFromDimensions', () => {
    const plaMaterial = {
      pricePerKg: MATERIAL_INFO.PLA.pricePerKg,
      density: MATERIAL_INFO.PLA.density,
      maintenanceFactor: MATERIAL_INFO.PLA.maintenanceFactor,
    };

    const petgMaterial = {
      pricePerKg: MATERIAL_INFO.PETG.pricePerKg,
      density: MATERIAL_INFO.PETG.density,
      maintenanceFactor: MATERIAL_INFO.PETG.maintenanceFactor,
    };

    it('should return positive price and weight for single unit', () => {
      const result = calculatePriceFromDimensions(100, 100, 100, 60, plaMaterial);
      expect(result.finalPrice).toBeGreaterThan(0);
      expect(result.weight).toBeGreaterThan(0);
    });

    it('should apply lower per-unit price for bulk quantity (10+)', () => {
      const resultUnit = calculatePriceFromDimensions(50, 50, 50, 60, plaMaterial, { quantity: 1 });
      const resultBulk = calculatePriceFromDimensions(50, 50, 50, 60, plaMaterial, { quantity: 10 });
      expect(resultBulk.finalPrice).toBeLessThan(resultUnit.finalPrice);
    });

    it('should produce different prices for PLA and PETG', () => {
      const pricePLA  = calculatePriceFromDimensions(100, 100, 100, 60, plaMaterial);
      const pricePETG = calculatePriceFromDimensions(100, 100, 100, 60, petgMaterial);
      expect(pricePLA.finalPrice).not.toBe(pricePETG.finalPrice);
    });

    it('should add finishCost as a flat fee (not affected by margin)', () => {
      const margins = PRICING_CONFIG.margins;
      const noFinish   = calculatePriceFromDimensions(50, 50, 50, 60, plaMaterial);
      const withFinish = calculatePriceFromDimensions(50, 50, 50, 60, plaMaterial, { finishCost: 5 });
      // El acabado se multiplica por el margen (unit)
      const expectedDiff = 5 * margins.unit;
      expect(withFinish.finalPrice - noFinish.finalPrice).toBeCloseTo(expectedDiff, 1);
    });

    it('should return the full PriceCalculation structure', () => {
      const result = calculatePriceFromDimensions(50, 50, 50, 60, plaMaterial, { finishCost: 2 });
      expect(result).toHaveProperty('weight');
      expect(result).toHaveProperty('printTimeMinutes');
      expect(result).toHaveProperty('materialCost');
      expect(result).toHaveProperty('machineCost');
      expect(result).toHaveProperty('finishCost');
      expect(result).toHaveProperty('baseCost');
      expect(result).toHaveProperty('finalPrice');
    });
  });

  describe('MATERIAL_INFO', () => {
    it('should have PLA and PETG defined', () => {
      expect(MATERIAL_INFO.PLA).toBeDefined();
      expect(MATERIAL_INFO.PETG).toBeDefined();
    });

    it('should have correct density values', () => {
      expect(MATERIAL_INFO.PLA.density).toBe(1.24);
      expect(MATERIAL_INFO.PETG.density).toBe(1.27);
    });

    it('should have all required properties', () => {
      const requiredProps = ['label', 'density', 'basePricePerGram', 'color', 'properties', 'uses'];
      requiredProps.forEach(prop => {
        expect(MATERIAL_INFO.PLA).toHaveProperty(prop);
        expect(MATERIAL_INFO.PETG).toHaveProperty(prop);
      });
    });

    it('should have properties array with valid items', () => {
      expect(MATERIAL_INFO.PLA.properties).toBeInstanceOf(Array);
      expect(MATERIAL_INFO.PLA.properties.length).toBeGreaterThan(0);
      expect(MATERIAL_INFO.PLA.properties[0]).toHaveProperty('name');
      expect(MATERIAL_INFO.PLA.properties[0]).toHaveProperty('value');
    });
  });
});
