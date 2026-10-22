import { describe, expect, it } from "vitest";
import { normalizePriceForItem } from "./measurements";

describe("normalizePriceForItem", () => {
  it("normalizes eggs to yen per egg", () => {
    expect(
      normalizePriceForItem({
        comparisonBasisAmount: 1,
        comparisonUnit: "count",
        packageAmount: 10,
        packageUnit: "count",
        totalPriceYen: 300,
      }),
    ).toBe(30);
  });

  it("normalizes meat to yen per 100g", () => {
    expect(
      normalizePriceForItem({
        comparisonBasisAmount: 100,
        comparisonUnit: "g",
        packageAmount: 500,
        packageUnit: "g",
        totalPriceYen: 600,
      }),
    ).toBe(120);
  });

  it("rejects incompatible units", () => {
    expect(() =>
      normalizePriceForItem({
        comparisonBasisAmount: 100,
        comparisonUnit: "g",
        packageAmount: 12,
        packageUnit: "count",
        totalPriceYen: 300,
      }),
    ).toThrow("cannot be compared");
  });

  it.each([
    { price: 201, amount: 800, basis: 100, expected: 25.13 },
    { price: 26.75, amount: 10, basis: 1, expected: 2.68 },
    { price: 255, amount: 20000, basis: 100, expected: 1.28 },
    { price: 1, amount: 3, basis: 3, expected: 1 },
    { price: 0.01, amount: 85899345.92, basis: 42949672.96, expected: 0.01 },
    { price: 1.005, amount: 1, basis: 1, expected: 1.01 },
  ])("matches stored decimal rounding for $price / $amount * $basis", ({
    price, amount, basis, expected,
  }) => {
    expect(normalizePriceForItem({
      totalPriceYen: price,
      packageAmount: amount,
      comparisonBasisAmount: basis,
      packageUnit: "g",
      comparisonUnit: "g",
    })).toBe(expected);
  });

  it("preserves compatible unit conversion while rounding", () => {
    expect(normalizePriceForItem({
      totalPriceYen: 201,
      packageAmount: 0.8,
      comparisonBasisAmount: 100,
      packageUnit: "kg",
      comparisonUnit: "g",
    })).toBe(25.13);
  });

  it.each([
    { price: 123, amount: 123, unit: "g", comparison: "kg", expected: 1000 },
    { price: 10, amount: 1, unit: "ml", comparison: "l", expected: 10000 },
  ] as const)("retains conversion precision from $unit to $comparison", ({
    price, amount, unit, comparison, expected,
  }) => {
    expect(normalizePriceForItem({
      totalPriceYen: price,
      packageAmount: amount,
      comparisonBasisAmount: 1,
      packageUnit: unit,
      comparisonUnit: comparison,
    })).toBe(expected);
  });
});
