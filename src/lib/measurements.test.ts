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
});
