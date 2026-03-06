import { calculateWeight, calculatePrice, MATERIAL_INFO } from '@/lib/price-calculator';

describe('Price Calculator', () => {
  describe('calculateWeight', () => {
    it('should calculate weight for PLA material', () => {
      // Dimensions in mm, volume converted to cm³ internally
      const weight = calculateWeight(100, 100, 100, MATERIAL_INFO.PLA.density);
      // Volume: 1000cm³ (100*100*100/1000), density: 1.24, infill: 0.2
      expect(weight).toBeCloseTo(1000 * 1.24 * 0.2, 1);
    });

    it('should calculate weight for PETG material', () => {
      const weight = calculateWeight(50, 50, 50, MATERIAL_INFO.PETG.density);
      // Volume: 125cm³ (50*50*50/1000), density: 1.27, infill: 0.2
      expect(weight).toBeCloseTo(125 * 1.27 * 0.2, 1);
    });

    it('should handle zero dimensions', () => {
      const weight = calculateWeight(0, 100, 100, MATERIAL_INFO.PLA.density);
      expect(weight).toBe(0);
    });
  });

  describe('calculatePrice', () => {
    it('should calculate price correctly for single quantity', () => {
      const config = {
        material: 'PLA',
        dimX: 100,
        dimY: 100,
        dimZ: 100,
        quantity: 1,
        basePricePerGram: MATERIAL_INFO.PLA.basePricePerGram,
        density: MATERIAL_INFO.PLA.density,
        finishCost: 2,
      };
      const result = calculatePrice(config);
      expect(result.total).toBeGreaterThan(0);
      expect(result.weight).toBeGreaterThan(0);
    });

    it('should scale price with quantity', () => {
      const baseConfig = {
        material: 'PLA',
        dimX: 50,
        dimY: 50,
        dimZ: 50,
        basePricePerGram: MATERIAL_INFO.PLA.basePricePerGram,
        density: MATERIAL_INFO.PLA.density,
        finishCost: 2,
      };
      const resultSingle = calculatePrice({ ...baseConfig, quantity: 1 });
      const resultDouble = calculatePrice({ ...baseConfig, quantity: 2 });
      expect(resultDouble.total).toBeCloseTo(resultSingle.total * 2, 2);
    });

    it('should have different prices for PLA and PETG', () => {
      const baseDims = { dimX: 100, dimY: 100, dimZ: 100, quantity: 1, finishCost: 2 };
      const configPLA = { ...baseDims, material: 'PLA', basePricePerGram: MATERIAL_INFO.PLA.basePricePerGram, density: MATERIAL_INFO.PLA.density };
      const configPETG = { ...baseDims, material: 'PETG', basePricePerGram: MATERIAL_INFO.PETG.basePricePerGram, density: MATERIAL_INFO.PETG.density };
      const pricePLA = calculatePrice(configPLA);
      const pricePETG = calculatePrice(configPETG);
      expect(pricePLA.total).not.toBe(pricePETG.total);
    });

    it('should return correct structure', () => {
      const config = {
        material: 'PLA',
        dimX: 50,
        dimY: 50,
        dimZ: 50,
        quantity: 1,
        basePricePerGram: 0.02,
        density: 1.24,
        finishCost: 2,
      };
      const result = calculatePrice(config);
      expect(result).toHaveProperty('weight');
      expect(result).toHaveProperty('materialCost');
      expect(result).toHaveProperty('finishCost');
      expect(result).toHaveProperty('subtotal');
      expect(result).toHaveProperty('total');
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
