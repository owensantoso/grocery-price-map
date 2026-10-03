import type { Database } from "@/lib/database.types";

export type MeasurementUnit = Database["public"]["Enums"]["measurement_unit"];

const WEIGHT_FACTORS: Partial<Record<MeasurementUnit, number>> = {
  g: 1,
  kg: 1000,
};

const VOLUME_FACTORS: Partial<Record<MeasurementUnit, number>> = {
  ml: 1,
  l: 1000,
};

const COUNT_FACTORS: Partial<Record<MeasurementUnit, number>> = {
  count: 1,
  piece: 1,
};

export const MEASUREMENT_UNITS: MeasurementUnit[] = [
  "count",
  "piece",
  "g",
  "kg",
  "ml",
  "l",
];

export const CANONICAL_ITEM_UNITS: MeasurementUnit[] = ["count", "g", "ml"];

export const MEASUREMENT_LABELS: Record<MeasurementUnit, string> = {
  count: "count",
  piece: "piece",
  g: "grams",
  kg: "kilograms",
  ml: "milliliters",
  l: "liters",
};

type UnitFamily = "count" | "weight" | "volume";

function getUnitFamily(unit: MeasurementUnit): UnitFamily {
  if (unit === "count" || unit === "piece") {
    return "count";
  }

  if (unit === "g" || unit === "kg") {
    return "weight";
  }

  return "volume";
}

export function areUnitsCompatible(
  sourceUnit: MeasurementUnit,
  targetUnit: MeasurementUnit,
) {
  return getUnitFamily(sourceUnit) === getUnitFamily(targetUnit);
}

function getUnitFactor(unit: MeasurementUnit) {
  const family = getUnitFamily(unit);
  if (family === "weight") return WEIGHT_FACTORS[unit]!;
  if (family === "volume") return VOLUME_FACTORS[unit]!;
  return COUNT_FACTORS[unit]!;
}

export function convertUnitAmount(
  amount: number,
  sourceUnit: MeasurementUnit,
  targetUnit: MeasurementUnit,
) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number.");
  }

  if (!areUnitsCompatible(sourceUnit, targetUnit)) {
    throw new Error(`${sourceUnit} cannot be compared against ${targetUnit}.`);
  }

  if (sourceUnit === targetUnit) {
    return amount;
  }

  return (amount * getUnitFactor(sourceUnit)) / getUnitFactor(targetUnit);
}

function roundPositiveRatio(numerator: bigint, denominator: bigint) {
  return (numerator * BigInt(2) + denominator) / (denominator * BigInt(2));
}

function storageHundredths(value: number) {
  const [coefficient, exponent = "0"] = value.toString().split("e");
  const [whole, fraction = ""] = coefficient.split(".");
  const digits = BigInt(whole + fraction);
  const shift = 2 + Number(exponent) - fraction.length;

  // Match the positive numeric(10, 2) inputs stored by Postgres, without
  // introducing binary floating-point rounding at a decimal halfway value.
  return shift >= 0
    ? digits * BigInt(10) ** BigInt(shift)
    : roundPositiveRatio(digits, BigInt(10) ** BigInt(-shift));
}

export function normalizePriceForItem(input: {
  packageAmount: number;
  packageUnit: MeasurementUnit;
  totalPriceYen: number;
  comparisonUnit: MeasurementUnit;
  comparisonBasisAmount: number;
}) {
  const { comparisonBasisAmount, comparisonUnit, packageAmount, packageUnit, totalPriceYen } =
    input;

  if (!Number.isFinite(totalPriceYen) || totalPriceYen <= 0) {
    throw new Error("Price must be a positive number.");
  }

  if (!Number.isFinite(comparisonBasisAmount) || comparisonBasisAmount <= 0) {
    throw new Error("Comparison basis must be a positive number.");
  }

  // Preserve the existing amount and compatibility validation. Keep conversion
  // factors in the exact ratio below, rather than rounding a converted amount.
  convertUnitAmount(
    packageAmount,
    packageUnit,
    comparisonUnit,
  );

  const priceHundredths = storageHundredths(totalPriceYen);
  const packageHundredths = storageHundredths(packageAmount);
  const basisHundredths = storageHundredths(comparisonBasisAmount);

  if (
    priceHundredths === BigInt(0) ||
    packageHundredths === BigInt(0) ||
    basisHundredths === BigInt(0)
  ) {
    throw new Error("Pricing inputs must remain positive at 2 decimal places.");
  }

  const normalizedHundredths = roundPositiveRatio(
    priceHundredths * basisHundredths * BigInt(getUnitFactor(comparisonUnit)),
    packageHundredths * BigInt(getUnitFactor(packageUnit)),
  );

  return Number(normalizedHundredths) / 100;
}
