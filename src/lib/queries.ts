import type { User } from "@supabase/supabase-js";
import {
  demoItems,
  demoStores,
  getDemoCompareEntries,
} from "@/lib/demo-data";
import type { CompareEntry, ItemRecord, StoreRecord, Viewer } from "@/lib/models";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ComparisonSnapshot = {
  entries: CompareEntry[];
  isConfigured: boolean;
  isDemo: boolean;
  items: ItemRecord[];
  selectedItem: ItemRecord | null;
  viewer: Viewer | null;
};

function toViewer(user: User | null): Viewer | null {
  if (!user?.email) {
    return null;
  }

  return {
    email: user.email,
    id: user.id,
  };
}

export async function getViewer(): Promise<Viewer | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return toViewer(user);
}

export async function getItems(): Promise<ItemRecord[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return demoItems;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [] satisfies ItemRecord[];
  }

  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ItemRecord[];
}

export async function getStores(): Promise<StoreRecord[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return demoStores;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [] satisfies StoreRecord[];
  }

  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as StoreRecord[];
}

type PriceLogWithRelations = {
  created_at: string;
  id: string;
  item_id: string;
  normalized_price_yen: number;
  notes: string | null;
  observed_at: string;
  package_amount: number;
  package_unit: ItemRecord["comparison_unit"];
  store_id: string;
  stores: StoreRecord | null;
  submitted_by: string;
  total_price_yen: number;
};

function buildCompareEntries(logs: PriceLogWithRelations[], selectedItem: ItemRecord) {
  const seenStores = new Set<string>();
  const entries: CompareEntry[] = [];

  const sortedLogs = [...logs].sort((left, right) => {
    if (left.observed_at === right.observed_at) {
      return right.created_at.localeCompare(left.created_at);
    }

    return right.observed_at.localeCompare(left.observed_at);
  });

  for (const log of sortedLogs) {
    if (seenStores.has(log.store_id) || !log.stores) {
      continue;
    }

    seenStores.add(log.store_id);

    entries.push({
      history: sortedLogs
        .filter((candidate) => candidate.store_id === log.store_id)
        .map((candidate) => ({
          created_at: candidate.created_at,
          id: candidate.id,
          item_id: candidate.item_id,
          normalized_price_yen: candidate.normalized_price_yen,
          notes: candidate.notes,
          observed_at: candidate.observed_at,
          package_amount: candidate.package_amount,
          package_unit: candidate.package_unit,
          store_id: candidate.store_id,
          submitted_by: candidate.submitted_by,
          total_price_yen: candidate.total_price_yen,
        })),
      item: selectedItem,
      latestLog: {
        created_at: log.created_at,
        id: log.id,
        item_id: log.item_id,
        normalized_price_yen: log.normalized_price_yen,
        notes: log.notes,
        observed_at: log.observed_at,
        package_amount: log.package_amount,
        package_unit: log.package_unit,
        store_id: log.store_id,
        submitted_by: log.submitted_by,
        total_price_yen: log.total_price_yen,
      },
      store: log.stores,
    });
  }

  return entries.sort((left, right) => {
    if (left.latestLog.normalized_price_yen === right.latestLog.normalized_price_yen) {
      return right.latestLog.observed_at.localeCompare(left.latestLog.observed_at);
    }

    return left.latestLog.normalized_price_yen - right.latestLog.normalized_price_yen;
  });
}

export async function getComparisonSnapshot(
  itemId?: string | null,
): Promise<ComparisonSnapshot> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const selectedItem = demoItems.find((item) => item.id === itemId) ?? demoItems[0] ?? null;

    return {
      entries: selectedItem ? getDemoCompareEntries(selectedItem.id) : ([] as CompareEntry[]),
      isConfigured: false,
      isDemo: true,
      items: demoItems,
      selectedItem,
      viewer: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewer = toViewer(user);

  if (!viewer) {
    return {
      entries: [] as CompareEntry[],
      isConfigured: true,
      isDemo: false,
      items: [] as ItemRecord[],
      selectedItem: null,
      viewer: null,
    };
  }

  const items = await getItems();
  const selectedItem = items.find((item) => item.id === itemId) ?? items[0] ?? null;

  if (!selectedItem) {
    return {
      entries: [] as CompareEntry[],
      isConfigured: true,
      isDemo: false,
      items,
      selectedItem: null,
      viewer,
    };
  }

  const { data, error } = await supabase
    .from("price_logs")
    .select(
      `
        id,
        store_id,
        item_id,
        submitted_by,
        package_amount,
        package_unit,
        total_price_yen,
        normalized_price_yen,
        observed_at,
        notes,
        created_at,
        stores (
          id,
          name,
          chain_name,
          address_text,
          latitude,
          longitude,
          notes,
          created_at,
          created_by
        )
      `,
    )
    .eq("item_id", selectedItem.id);

  if (error) {
    throw new Error(error.message);
  }

  const logs = (data ?? []) as unknown as PriceLogWithRelations[];

  return {
    entries: buildCompareEntries(logs, selectedItem),
    isConfigured: true,
    isDemo: false,
    items,
    selectedItem,
    viewer,
  };
}

export async function getStoresSnapshot(): Promise<{
  stores: StoreRecord[];
  viewer: Viewer | null;
}> {
  const [stores, viewer] = await Promise.all([getStores(), getViewer()]);

  return {
    stores,
    viewer,
  };
}

export async function getItemsSnapshot(): Promise<{
  items: ItemRecord[];
  viewer: Viewer | null;
}> {
  const [items, viewer] = await Promise.all([getItems(), getViewer()]);

  return {
    items,
    viewer,
  };
}

export async function getPriceEntrySnapshot(): Promise<{
  items: ItemRecord[];
  stores: StoreRecord[];
  viewer: Viewer | null;
}> {
  const [items, stores, viewer] = await Promise.all([getItems(), getStores(), getViewer()]);

  return {
    items,
    stores,
    viewer,
  };
}
