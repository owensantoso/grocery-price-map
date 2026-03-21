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

  const family = getUnitFamily(sourceUnit);

  if (family === "weight") {
    return (amount * WEIGHT_FACTORS[sourceUnit]!) / WEIGHT_FACTORS[targetUnit]!;
  }

  if (family === "volume") {
    return (amount * VOLUME_FACTORS[sourceUnit]!) / VOLUME_FACTORS[targetUnit]!;
  }

  return (amount * COUNT_FACTORS[sourceUnit]!) / COUNT_FACTORS[targetUnit]!;
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

  const normalizedPackageAmount = convertUnitAmount(
    packageAmount,
    packageUnit,
    comparisonUnit,
  );

  return Number(
    ((totalPriceYen / normalizedPackageAmount) * comparisonBasisAmount).toFixed(2),
  );
}
