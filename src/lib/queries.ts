import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import {
  demoItems,
  getDemoCompareEntries,
  getDemoLogDetail,
  getDemoLogsFeed,
  getDemoStoreDetail,
  demoStores,
} from "@/lib/demo-data";
import type {
  CompareEntry,
  ItemRecord,
  LogDetail,
  ProfileRecord,
  PriceLogCommentVoteRecord,
  PriceLogListEntry,
  PriceLogRecord,
  PriceLogVoteRecord,
  PublicProfileRecord,
  StoreDetail,
  StoreRecord,
  Viewer,
} from "@/lib/models";
import {
  buildCommentEntries,
  buildCompareEntries,
  buildLogFeedEntries,
  createEmptyVoteSummary,
  sortFeedEntries,
  stripRelations,
  summarizeCommentVotes,
  summarizeVotes,
  type PriceLogCommentRow,
  type PriceLogSort,
  type PriceLogWithRelations,
} from "@/lib/query-read-models";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export {
  buildCommentEntries,
  buildCompareEntries,
  buildLogFeedEntries,
  createEmptyVoteSummary,
  sortFeedEntries,
  summarizeCommentVotes,
  summarizeVotes,
  type PriceLogSort,
  type PriceLogWithRelations,
} from "@/lib/query-read-models";

const PRICE_LOG_SELECT = `
  id,
  store_id,
  item_id,
  submitted_by,
  package_amount,
  package_unit,
  total_price_yen,
  price_tax_excluded_yen,
  normalized_price_yen,
  observed_at,
  notes,
  listing_url,
  photo_path,
  created_at,
  items (
    id,
    name,
    category,
    comparison_unit,
    comparison_basis_amount,
    created_at,
    created_by
  ),
  stores (
    id,
    name,
    chain_name,
    store_kind,
    store_url,
    address_text,
    latitude,
    longitude,
    notes,
    created_at,
    created_by
  )
`;

type ComparisonSnapshot = {
  entries: CompareEntry[];
  isConfigured: boolean;
  isDemo: boolean;
  items: ItemRecord[];
  selectedItem: ItemRecord | null;
  viewer: Viewer | null;
};

type PriceLogsSnapshot = {
  allLogs: PriceLogListEntry[];
  isConfigured: boolean;
  isDemo: boolean;
  ownLogs: PriceLogListEntry[];
  viewer: Viewer | null;
};

type AccountSettingsSnapshot = {
  isConfigured: boolean;
  profile: ProfileRecord | null;
  viewer: Viewer | null;
};

type PriceLogDetailRow = PriceLogWithRelations;

function toViewer(user: User | null): Viewer | null {
  if (!user?.email) {
    return null;
  }

  return {
    email: user.email,
    id: user.id,
    publicName: user.user_metadata?.public_name ?? user.user_metadata?.name ?? user.email,
  };
}

function toViewerWithProfile(user: User | null, profile: ProfileRecord | null): Viewer | null {
  const base = toViewer(user);

  if (!base) {
    return null;
  }

  return {
    ...base,
    publicName: profile?.public_name?.trim() || base.publicName,
  };
}

async function getVoteRowsForLogs(
  logIds: string[],
): Promise<PriceLogVoteRecord[]> {
  if (logIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("price_log_votes")
    .select("log_id, user_id, value, created_at")
    .in("log_id", logIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PriceLogVoteRecord[];
}

async function getVoteRowsForComments(
  commentIds: string[],
): Promise<PriceLogCommentVoteRecord[]> {
  if (commentIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("price_log_comment_votes")
    .select("comment_id, user_id, value, created_at")
    .in("comment_id", commentIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PriceLogCommentVoteRecord[];
}

async function getPublicProfileLabels(
  authorIds: string[],
): Promise<Map<string, string>> {
  if (authorIds.length === 0) {
    return new Map();
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("public_profiles")
    .select("id, public_name")
    .in("id", [...new Set(authorIds)]);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as PublicProfileRecord[])
      .filter((row): row is { id: string; public_name: string | null } => Boolean(row.id))
      .map((row) => [row.id, row.public_name?.trim() || "User"]),
  );
}

const getViewerCached = cache(async (): Promise<Viewer | null> => {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return toViewerWithProfile(user, (profile as ProfileRecord | null) ?? null);
});

const getCachedItems = unstable_cache(
  async (): Promise<ItemRecord[]> => {
    const supabase = createSupabasePublicClient();

    if (!supabase) {
      return demoItems;
    }

    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as ItemRecord[];
  },
  ["items"],
  {
    revalidate: 300,
    tags: ["items"],
  },
);

const getCachedStores = unstable_cache(
  async (): Promise<StoreRecord[]> => {
    const supabase = createSupabasePublicClient();

    if (!supabase) {
      return demoStores;
    }

    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as StoreRecord[];
  },
  ["stores"],
  {
    revalidate: 300,
    tags: ["stores"],
  },
);

function getCachedPriceLogsByItem(itemId: string) {
  return unstable_cache(
    async (): Promise<PriceLogWithRelations[]> => {
      const supabase = createSupabasePublicClient();

      if (!supabase) {
        return [];
      }

      const { data, error } = await supabase
        .from("price_logs")
        .select(PRICE_LOG_SELECT)
        .eq("item_id", itemId);

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []) as unknown as PriceLogWithRelations[];
    },
    ["price-logs:item", itemId],
    {
      revalidate: 30,
      tags: ["price-logs", `price-logs:item:${itemId}`],
    },
  )();
}

function getCachedPriceLogsByStore(storeId: string) {
  return unstable_cache(
    async (): Promise<PriceLogWithRelations[]> => {
      const supabase = createSupabasePublicClient();

      if (!supabase) {
        return [];
      }

      const { data, error } = await supabase
        .from("price_logs")
        .select(PRICE_LOG_SELECT)
        .eq("store_id", storeId);

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []) as unknown as PriceLogWithRelations[];
    },
    ["price-logs:store", storeId],
    {
      revalidate: 30,
      tags: ["price-logs", `price-logs:store:${storeId}`],
    },
  )();
}

const getCachedAllPriceLogs = unstable_cache(
  async (): Promise<PriceLogWithRelations[]> => {
    const supabase = createSupabasePublicClient();

    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase.from("price_logs").select(PRICE_LOG_SELECT);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as unknown as PriceLogWithRelations[];
  },
  ["price-logs:all"],
  {
    revalidate: 30,
    tags: ["price-logs"],
  },
);

function getCachedPriceLogById(logId: string) {
  return unstable_cache(
    async (): Promise<PriceLogDetailRow | null> => {
      const supabase = createSupabasePublicClient();

      if (!supabase) {
        return null;
      }

      const { data, error } = await supabase
        .from("price_logs")
        .select(PRICE_LOG_SELECT)
        .eq("id", logId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? null) as unknown as PriceLogDetailRow | null;
    },
    ["price-log", logId],
    {
      revalidate: 30,
      tags: ["price-logs", `price-log:${logId}`],
    },
  )();
}

export async function getViewer(): Promise<Viewer | null> {
  return getViewerCached();
}

export async function getItems(): Promise<ItemRecord[]> {
  if (!createSupabasePublicClient()) {
    return demoItems;
  }

  return getCachedItems();
}

export async function getStores(): Promise<StoreRecord[]> {
  if (!createSupabasePublicClient()) {
    return demoStores;
  }

  return getCachedStores();
}

export async function getComparisonSnapshot(
  itemId?: string | null,
): Promise<ComparisonSnapshot> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const selectedItem = demoItems.find((item) => item.id === itemId) ?? demoItems[0] ?? null;

    return {
      entries: selectedItem ? getDemoCompareEntries(selectedItem.id) : [],
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

  const items = await getItems();
  const selectedItem = items.find((item) => item.id === itemId) ?? items[0] ?? null;

  if (!selectedItem) {
    return {
      entries: [],
      isConfigured: true,
      isDemo: false,
      items,
      selectedItem: null,
      viewer: viewer ?? null,
    };
  }

  const logs = await getCachedPriceLogsByItem(selectedItem.id);
  const voteRows = await getVoteRowsForLogs(logs.map((log) => log.id));
  const voteSummaries = summarizeVotes(voteRows, viewer?.id ?? null);

  return {
    entries: buildCompareEntries(logs, selectedItem, voteSummaries, viewer?.id ?? null),
    isConfigured: true,
    isDemo: false,
    items,
    selectedItem,
    viewer: viewer ?? null,
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

export async function getPriceLogsSnapshot(sort: PriceLogSort = "recent"): Promise<PriceLogsSnapshot> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      allLogs: sortFeedEntries(getDemoLogsFeed(null), sort),
      isConfigured: false,
      isDemo: true,
      ownLogs: [],
      viewer: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user
    ? (
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle()
      ).data
    : null;
  const viewer = toViewerWithProfile(user, (profile as ProfileRecord | null) ?? null);

  const logs = await getCachedAllPriceLogs();
  const votes = await getVoteRowsForLogs(logs.map((log) => log.id));
  const voteSummaries = summarizeVotes(votes, viewer?.id ?? null);
  const allLogs = sortFeedEntries(
    buildLogFeedEntries(logs, voteSummaries, viewer?.id ?? null),
    sort,
  );

  return {
    allLogs,
    isConfigured: true,
    isDemo: false,
    ownLogs: viewer ? allLogs.filter((entry) => entry.log.submitted_by === viewer.id) : [],
    viewer: viewer ?? null,
  };
}

export async function getAccountSettingsSnapshot(): Promise<AccountSettingsSnapshot> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      isConfigured: false,
      profile: null,
      viewer: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      isConfigured: true,
      profile: null,
      viewer: null,
    };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    isConfigured: true,
    profile: (profile as ProfileRecord | null) ?? null,
    viewer: toViewerWithProfile(user, (profile as ProfileRecord | null) ?? null),
  };
}

export async function getEditablePriceLogSnapshot(logId: string): Promise<{
  items: ItemRecord[];
  log: PriceLogRecord | null;
  stores: StoreRecord[];
  viewer: Viewer | null;
}> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      items: demoItems,
      log: null,
      stores: demoStores,
      viewer: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewer = toViewer(user);

  if (!viewer) {
    return {
      items: [],
      log: null,
      stores: [],
      viewer: null,
    };
  }

  const [items, stores] = await Promise.all([getItems(), getStores()]);
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
        price_tax_excluded_yen,
        normalized_price_yen,
        observed_at,
        notes,
        listing_url,
        photo_path,
        created_at
      `,
    )
    .eq("id", logId)
    .eq("submitted_by", viewer.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    items,
    log: (data ?? null) as PriceLogRecord | null,
    stores,
    viewer,
  };
}

export async function getPriceLogDetail(logId: string): Promise<LogDetail | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoLogDetail(logId);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewer = toViewer(user);

  const log = await getCachedPriceLogById(logId);

  if (!log || !log.items || !log.stores) {
    return null;
  }

  const itemLogs = await getCachedPriceLogsByItem(log.item_id);
  const voteRows = await getVoteRowsForLogs(itemLogs.map((entry) => entry.id));
  const voteSummaries = summarizeVotes(voteRows, viewer?.id ?? null);
  const { data: commentData, error: commentError } = await supabase
    .from("price_log_comments")
    .select(
      `
        id,
        log_id,
        author_id,
        body,
        created_at
      `,
    )
    .eq("log_id", logId);

  if (commentError) {
    throw new Error(commentError.message);
  }

  const comments = (commentData ?? []) as PriceLogCommentRow[];
  const authorLabels = await getPublicProfileLabels(
    comments.map((comment) => comment.author_id),
  );
  const commentVoteRows = await getVoteRowsForComments(comments.map((comment) => comment.id));
  const commentVoteSummaries = summarizeCommentVotes(commentVoteRows, viewer?.id ?? null);
  const sameStoreHistory = buildLogFeedEntries(
    itemLogs.filter((candidate) => candidate.store_id === log.store_id),
    voteSummaries,
    viewer?.id ?? null,
  );

  return {
    canEdit: viewer?.id === log.submitted_by,
    comments: buildCommentEntries(comments, authorLabels, commentVoteSummaries),
    item: log.items,
    latestAcrossStores: buildCompareEntries(
      itemLogs,
      log.items,
      voteSummaries,
      viewer?.id ?? null,
    ),
    log: stripRelations(log),
    recentItemLogs: buildLogFeedEntries(itemLogs, voteSummaries, viewer?.id ?? null),
    sameStoreHistory,
    store: log.stores,
    viewer: viewer ?? null,
    voteSummary: voteSummaries.get(log.id) ?? createEmptyVoteSummary(),
  };
}

export async function getStoreDetail(storeId: string): Promise<StoreDetail | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoStoreDetail(storeId);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewer = toViewer(user);

  const [stores, items] = await Promise.all([getStores(), getItems()]);
  const store = stores.find((candidate) => candidate.id === storeId) ?? null;

  if (!store) {
    return null;
  }

  const logs = await getCachedPriceLogsByStore(storeId);
  const voteRows = await getVoteRowsForLogs(logs.map((log) => log.id));
  const voteSummaries = summarizeVotes(voteRows, viewer?.id ?? null);
  const recentLogs = buildLogFeedEntries(logs, voteSummaries, viewer?.id ?? null);
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const photoGallery = recentLogs.flatMap((entry) => {
    if (!entry.log.photo_path) {
      return [];
    }

    const item = itemMap.get(entry.log.item_id) ?? entry.item;

    return [
      {
        item,
        log: entry.log,
      },
    ];
  });

  return {
    photoGallery,
    recentLogs,
    store,
    viewer,
  };
}
