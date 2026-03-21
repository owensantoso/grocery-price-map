import type { CompareEntry, ItemRecord, PriceLogRecord, StoreRecord } from "@/lib/models";
import { normalizePriceForItem } from "@/lib/measurements";

const DEMO_USER_ID = "demo-user";

export const demoItems: ItemRecord[] = [
  {
    id: "item-eggs",
    name: "Eggs",
    category: "Protein",
    comparison_unit: "count",
    comparison_basis_amount: 1,
    created_at: "2026-03-21T00:00:00.000Z",
    created_by: DEMO_USER_ID,
  },
  {
    id: "item-pork-mince",
    name: "Pork mince",
    category: "Meat",
    comparison_unit: "g",
    comparison_basis_amount: 100,
    created_at: "2026-03-21T00:00:00.000Z",
    created_by: DEMO_USER_ID,
  },
  {
    id: "item-chicken-breast",
    name: "Chicken breast",
    category: "Meat",
    comparison_unit: "g",
    comparison_basis_amount: 100,
    created_at: "2026-03-21T00:00:00.000Z",
    created_by: DEMO_USER_ID,
  },
];

export const demoStores: StoreRecord[] = [
  {
    id: "store-summit-nishi-eifuku",
    name: "Summit Nishi-Eifuku",
    chain_name: "Summit",
    address_text: "Nishi-Eifuku, Suginami-ku",
    latitude: 35.6732,
    longitude: 139.6375,
    notes: "Easy stop on the walk home from the station.",
    created_at: "2026-03-21T00:00:00.000Z",
    created_by: DEMO_USER_ID,
  },
  {
    id: "store-hanamasa-honancho",
    name: "Niku no Hanamasa Honancho",
    chain_name: "Niku no Hanamasa",
    address_text: "Honancho, Suginami-ku",
    latitude: 35.6839,
    longitude: 139.6571,
    notes: "Good for meat packs and late hours.",
    created_at: "2026-03-21T00:00:00.000Z",
    created_by: DEMO_USER_ID,
  },
  {
    id: "store-gyomu-nakano",
    name: "Gyomu Super Nakano",
    chain_name: "Gyomu Super",
    address_text: "Nakano, Nakano-ku",
    latitude: 35.7061,
    longitude: 139.6659,
    notes: "Bulk sizes are usually strongest here.",
    created_at: "2026-03-21T00:00:00.000Z",
    created_by: DEMO_USER_ID,
  },
];

function createLog(input: Omit<PriceLogRecord, "created_at" | "normalized_price_yen"> & {
  item: ItemRecord;
}) {
  return {
    ...input,
    created_at: `${input.observed_at}T09:00:00.000Z`,
    normalized_price_yen: normalizePriceForItem({
      comparisonBasisAmount: input.item.comparison_basis_amount,
      comparisonUnit: input.item.comparison_unit,
      packageAmount: input.package_amount,
      packageUnit: input.package_unit,
      totalPriceYen: input.total_price_yen,
    }),
  } satisfies PriceLogRecord;
}

export const demoPriceLogs: PriceLogRecord[] = [
  createLog({
    id: "log-eggs-summit-latest",
    item: demoItems[0],
    item_id: demoItems[0].id,
    notes: "Large eggs, regular shelf price.",
    observed_at: "2026-03-20",
    package_amount: 10,
    package_unit: "count",
    store_id: demoStores[0].id,
    submitted_by: DEMO_USER_ID,
    total_price_yen: 298,
  }),
  createLog({
    id: "log-eggs-summit-old",
    item: demoItems[0],
    item_id: demoItems[0].id,
    notes: "Previous week.",
    observed_at: "2026-03-12",
    package_amount: 10,
    package_unit: "count",
    store_id: demoStores[0].id,
    submitted_by: DEMO_USER_ID,
    total_price_yen: 318,
  }),
  createLog({
    id: "log-eggs-hanamasa",
    item: demoItems[0],
    item_id: demoItems[0].id,
    notes: "Smaller carton, very steady price.",
    observed_at: "2026-03-19",
    package_amount: 10,
    package_unit: "count",
    store_id: demoStores[1].id,
    submitted_by: DEMO_USER_ID,
    total_price_yen: 272,
  }),
  createLog({
    id: "log-eggs-gyomu",
    item: demoItems[0],
    item_id: demoItems[0].id,
    notes: "Bulk box by the refrigerated wall.",
    observed_at: "2026-03-18",
    package_amount: 12,
    package_unit: "count",
    store_id: demoStores[2].id,
    submitted_by: DEMO_USER_ID,
    total_price_yen: 336,
  }),
  createLog({
    id: "log-pork-summit",
    item: demoItems[1],
    item_id: demoItems[1].id,
    notes: "Fine mince.",
    observed_at: "2026-03-20",
    package_amount: 450,
    package_unit: "g",
    store_id: demoStores[0].id,
    submitted_by: DEMO_USER_ID,
    total_price_yen: 585,
  }),
  createLog({
    id: "log-pork-hanamasa",
    item: demoItems[1],
    item_id: demoItems[1].id,
    notes: "Larger family pack.",
    observed_at: "2026-03-20",
    package_amount: 1000,
    package_unit: "g",
    store_id: demoStores[1].id,
    submitted_by: DEMO_USER_ID,
    total_price_yen: 1098,
  }),
  createLog({
    id: "log-pork-gyomu",
    item: demoItems[1],
    item_id: demoItems[1].id,
    notes: "Frozen section.",
    observed_at: "2026-03-17",
    package_amount: 500,
    package_unit: "g",
    store_id: demoStores[2].id,
    submitted_by: DEMO_USER_ID,
    total_price_yen: 548,
  }),
];

export function getDemoCompareEntries(itemId: string) {
  const selectedItem = demoItems.find((item) => item.id === itemId) ?? demoItems[0];

  const logsForItem = demoPriceLogs
    .filter((log) => log.item_id === selectedItem.id)
    .sort((left, right) => {
      if (left.observed_at === right.observed_at) {
        return right.created_at.localeCompare(left.created_at);
      }

      return right.observed_at.localeCompare(left.observed_at);
    });

  const seenStores = new Set<string>();
  const entries: CompareEntry[] = [];

  for (const log of logsForItem) {
    if (seenStores.has(log.store_id)) {
      continue;
    }

    seenStores.add(log.store_id);

    const store = demoStores.find((candidate) => candidate.id === log.store_id);

    if (!store) {
      continue;
    }

    entries.push({
      history: logsForItem.filter((candidate) => candidate.store_id === log.store_id),
      item: selectedItem,
      latestLog: log,
      store,
    });
  }

  return entries.sort((left, right) => {
    if (left.latestLog.normalized_price_yen === right.latestLog.normalized_price_yen) {
      return right.latestLog.observed_at.localeCompare(left.latestLog.observed_at);
    }

    return left.latestLog.normalized_price_yen - right.latestLog.normalized_price_yen;
  });
}
