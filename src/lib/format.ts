import type { MeasurementUnit } from "@/lib/measurements";

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("ja-JP", {
    currency: "JPY",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-JP", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatUnitValue(value: number, unit: MeasurementUnit) {
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(2);
  return `${rounded}${unit}`;
}

export function formatPackage(amount: number, unit: MeasurementUnit) {
  return `${Number.isInteger(amount) ? amount.toString() : amount.toFixed(2)} ${unit}`;
}
