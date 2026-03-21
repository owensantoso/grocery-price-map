import { describe, expect, it } from "vitest";
import { excludedFromIncluded, includedFromExcluded } from "./pricing";

describe("pricing helpers", () => {
  it("derives tax-included price from tax-excluded", () => {
    expect(includedFromExcluded(100)).toBe(110);
  });

  it("derives tax-excluded price from tax-included", () => {
    expect(excludedFromIncluded(110)).toBe(100);
  });
});
