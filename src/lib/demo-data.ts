import type {
  CompareEntry,
  ItemRecord,
  LogDetail,
  PriceLogListEntry,
  PriceLogRecord,
  PriceLogVoteRecord,
  StoreRecord,
  VoteSummary,
} from "@/lib/models";
import { normalizePriceForItem } from "@/lib/measurements";
import { excludedFromIncluded } from "@/lib/pricing";
import { createGoogleMapsQueryUrl } from "@/lib/urls";

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
    store_kind: "physical",
    store_url: createGoogleMapsQueryUrl({
      label: "Summit Nishi-Eifuku",
      latitude: 35.6732,
      longitude: 139.6375,
    }),
    address_text: "Nishi-Eifuku, Suginami-ku",
    latitude: 35.6732,
    longitude: 139.6375,
    notes: "Easy stop on the walk home from the station.",
    created_at: "2026-03-21T00:00:00.000Z",
    created_by: DEMO_USER_ID,
  },
  {
    id: "store-hanamasa-honancho",
    name: "Hanamasa Honancho",
    chain_name: "Niku no Hanamasa",
    store_kind: "physical",
    store_url: createGoogleMapsQueryUrl({
      label: "Niku no Hanamasa Honancho",
      latitude: 35.6839,
      longitude: 139.6571,
    }),
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
    store_kind: "physical",
    store_url: createGoogleMapsQueryUrl({
      label: "Gyomu Super Nakano",
      latitude: 35.7061,
      longitude: 139.6659,
    }),
    address_text: "Nakano, Nakano-ku",
    latitude: 35.7061,
    longitude: 139.6659,
    notes: "Bulk sizes are usually strongest here.",
    created_at: "2026-03-21T00:00:00.000Z",
    created_by: DEMO_USER_ID,
  },
  {
    id: "store-rakuten-online",
    name: "Rakuten Online Grocery",
    chain_name: "Rakuten",
    store_kind: "online",
    store_url: "https://www.rakuten.co.jp/",
    address_text: "Online store",
    latitude: null,
    longitude: null,
    notes: "Use for shelf-comparable online offers.",
    created_at: "2026-03-21T00:00:00.000Z",
    created_by: DEMO_USER_ID,
  },
];

function createLog(input: Omit<
  PriceLogRecord,
  "created_at" | "normalized_price_yen" | "price_tax_excluded_yen"
> & {
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
    price_tax_excluded_yen: excludedFromIncluded(input.total_price_yen),
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
    listing_url: null,
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
    listing_url: null,
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
    listing_url: null,
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
    listing_url: null,
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
    listing_url: null,
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
    listing_url: null,
  }),
  createLog({
    id: "log-pork-rakuten",
    item: demoItems[1],
    item_id: demoItems[1].id,
    notes: "Online-only bulk offer.",
    observed_at: "2026-03-21",
    package_amount: 1200,
    package_unit: "g",
    store_id: demoStores[3].id,
    submitted_by: DEMO_USER_ID,
    total_price_yen: 1188,
    listing_url: "https://www.rakuten.co.jp/search/pork-mince",
  }),
  createLog({
    id: "log-chicken-hanamasa",
    item: demoItems[2],
    item_id: demoItems[2].id,
    notes: "Fresh pack near the back cooler.",
    observed_at: "2026-03-21",
    package_amount: 2000,
    package_unit: "g",
    store_id: demoStores[1].id,
    submitted_by: DEMO_USER_ID,
    total_price_yen: 1800,
    listing_url: null,
  }),
  createLog({
    id: "log-chicken-summit",
    item: demoItems[2],
    item_id: demoItems[2].id,
    notes: "Smaller tray, still competitive.",
    observed_at: "2026-03-21",
    package_amount: 500,
    package_unit: "g",
    store_id: demoStores[0].id,
    submitted_by: DEMO_USER_ID,
    total_price_yen: 800,
    listing_url: null,
  }),
];

export const demoPriceLogVotes: PriceLogVoteRecord[] = [
  {
    created_at: "2026-03-21T01:00:00.000Z",
    log_id: "log-chicken-hanamasa",
    user_id: DEMO_USER_ID,
    value: 1,
  },
  {
    created_at: "2026-03-21T02:00:00.000Z",
    log_id: "log-chicken-hanamasa",
    user_id: "demo-friend-a",
    value: 1,
  },
  {
    created_at: "2026-03-21T03:00:00.000Z",
    log_id: "log-chicken-summit",
    user_id: "demo-friend-b",
    value: -1,
  },
  {
    created_at: "2026-03-21T04:00:00.000Z",
    log_id: "log-eggs-hanamasa",
    user_id: "demo-friend-a",
    value: 1,
  },
  {
    created_at: "2026-03-21T05:00:00.000Z",
    log_id: "log-pork-rakuten",
    user_id: "demo-friend-c",
    value: 1,
  },
];

function getDemoVoteSummary(logId: string, viewerId: string | null): VoteSummary {
  const votes = demoPriceLogVotes.filter((vote) => vote.log_id === logId);
  const upvotes = votes.filter((vote) => vote.value === 1).length;
  const downvotes = votes.filter((vote) => vote.value === -1).length;
  const viewerVote = (viewerId
    ? (votes.find((vote) => vote.user_id === viewerId)?.value ?? 0)
    : 0) as VoteSummary["viewerVote"];

  return {
    downvotes,
    score: upvotes - downvotes,
    upvotes,
    viewerVote,
  };
}

export function getDemoLogsFeed(viewerId: string | null = null): PriceLogListEntry[] {
  return [...demoPriceLogs]
    .sort((left, right) => {
      if (left.observed_at === right.observed_at) {
        return right.created_at.localeCompare(left.created_at);
      }

      return right.observed_at.localeCompare(left.observed_at);
    })
    .flatMap((log) => {
      const item = demoItems.find((candidate) => candidate.id === log.item_id);
      const store = demoStores.find((candidate) => candidate.id === log.store_id);

      if (!item || !store) {
        return [];
      }

      return [
        {
          canEdit: viewerId === log.submitted_by,
          item,
          log,
          store,
          voteSummary: getDemoVoteSummary(log.id, viewerId),
        } satisfies PriceLogListEntry,
      ];
    });
}

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

export function getDemoLogDetail(logId: string): LogDetail | null {
  const log = demoPriceLogs.find((candidate) => candidate.id === logId);

  if (!log) {
    return null;
  }

  const item = demoItems.find((candidate) => candidate.id === log.item_id);
  const store = demoStores.find((candidate) => candidate.id === log.store_id);

  if (!item || !store) {
    return null;
  }

  return {
    canEdit: false,
    item,
    latestAcrossStores: getDemoCompareEntries(item.id),
    log,
    recentItemLogs: getDemoLogsFeed(null).filter((entry) => entry.item.id === item.id),
    sameStoreHistory: demoPriceLogs
      .filter(
        (candidate) =>
          candidate.item_id === log.item_id && candidate.store_id === log.store_id,
      )
      .sort((left, right) => right.observed_at.localeCompare(left.observed_at)),
    store,
    voteSummary: getDemoVoteSummary(log.id, null),
  };
}
