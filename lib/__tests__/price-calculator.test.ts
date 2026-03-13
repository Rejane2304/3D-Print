import { describe, expect, test } from "vitest";
import {
  PRICING_CONFIG,
  calculateAdvancedPrice,
  calculatePriceFromDimensions,
  calculateWeight,
  getPriceByQuantity,
} from "../price-calculator";

describe("price calculator helpers", () => {
  test("calculateWeight applies density and fill factor", () => {
    const weight = calculateWeight(100, 50, 20, 1.24, 0.2);
    expect(weight).toBeCloseTo(24.8, 10);
  });

  test("getPriceByQuantity selects tiered price", () => {
    expect(getPriceByQuantity(1.5, 1.2, 0.9, 1)).toBe(1.5);
    expect(getPriceByQuantity(1.5, 1.2, 0.9, 5)).toBe(1.2);
    expect(getPriceByQuantity(1.5, 1.2, 0.9, 10)).toBe(0.9);
  });

  test("calculateAdvancedPrice returns consistent cost breakdown", () => {
    const result = calculateAdvancedPrice(
      20,
      60,
      { pricePerKg: 20, density: 1.24, maintenanceFactor: 0.03 },
      1
    );

    expect(result.weight).toBe(20);
    expect(result.machineCost).toBeCloseTo(0.12, 2);
    expect(result.operationCost).toBeCloseTo(0.04, 2);
    expect(result.maintenanceCost).toBeCloseTo(0.03, 2);
    expect(result.materialCost).toBeCloseTo(0.4, 2);
    expect(result.finalPrice).toBeGreaterThan(0);
  });

  test("calculatePriceFromDimensions ties final price to quantity tiers", () => {
    const result = calculatePriceFromDimensions(
      80,
      40,
      20,
      60,
      { pricePerKg: 20, density: 1.24, maintenanceFactor: 0.03 },
      {
        quantity: 5,
        finishCost: 2,
        refDimX: 80,
        refDimY: 40,
        refDimZ: 20,
      }
    );

    const expectedMedium = result.baseCost * PRICING_CONFIG.margins.medium;
    expect(result.priceMedium).toBeCloseTo(expectedMedium, 2);
    expect(result.finalPrice).toBe(
      getPriceByQuantity(result.priceUnit, result.priceMedium, result.priceBulk, 5)
    );
  });
});
