const TAX_RATE = 0.08;

function roundYen(value: number) {
  return Math.round(value);
}

export function includedFromExcluded(priceTaxExcludedYen: number) {
  return roundYen(priceTaxExcludedYen * (1 + TAX_RATE));
}

export function excludedFromIncluded(priceTaxIncludedYen: number) {
  return roundYen(priceTaxIncludedYen / (1 + TAX_RATE));
}
