import type { User } from "@supabase/supabase-js";
import {
  demoItems,
  getDemoCompareEntries,
  getDemoLogDetail,
  getDemoLogsFeed,
  demoStores,
} from "@/lib/demo-data";
import type {
  CommentThreadEntry,
  CompareEntry,
  ItemRecord,
  LogDetail,
  PriceLogCommentRecord,
  PriceLogCommentVoteRecord,
  PriceLogListEntry,
  PriceLogRecord,
  PriceLogVoteRecord,
  PublicProfileRecord,
  StoreRecord,
  Viewer,
  VoteSummary,
} from "@/lib/models";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

type PriceLogWithRelations = {
  created_at: string;
  id: string;
  item_id: string;
  items: ItemRecord | null;
  listing_url: string | null;
  normalized_price_yen: number;
  notes: string | null;
  observed_at: string;
  package_amount: number;
  package_unit: ItemRecord["comparison_unit"];
  photo_path: string | null;
  price_tax_excluded_yen: number;
  store_id: string;
  stores: StoreRecord | null;
  submitted_by: string;
  total_price_yen: number;
};

type PriceLogDetailRow = PriceLogWithRelations;

type PriceLogCommentRow = {
  author_id: string;
  body: string;
  created_at: string;
  id: string;
  log_id: string;
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

function stripRelations(log: PriceLogWithRelations): PriceLogRecord {
  return {
    created_at: log.created_at,
    id: log.id,
    item_id: log.item_id,
    listing_url: log.listing_url,
    normalized_price_yen: log.normalized_price_yen,
    notes: log.notes,
    observed_at: log.observed_at,
    package_amount: log.package_amount,
    package_unit: log.package_unit,
    photo_path: log.photo_path,
    price_tax_excluded_yen: log.price_tax_excluded_yen,
    store_id: log.store_id,
    submitted_by: log.submitted_by,
    total_price_yen: log.total_price_yen,
  };
}

function sortLogsByRecency(left: PriceLogWithRelations, right: PriceLogWithRelations) {
  if (left.observed_at === right.observed_at) {
    return right.created_at.localeCompare(left.created_at);
  }

  return right.observed_at.localeCompare(left.observed_at);
}

function createEmptyVoteSummary(): VoteSummary {
  return {
    downvotes: 0,
    score: 0,
    upvotes: 0,
    viewerVote: 0,
  };
}

function summarizeVotes(
  voteRows: PriceLogVoteRecord[],
  viewerId: string | null,
): Map<string, VoteSummary> {
  const summaries = new Map<string, VoteSummary>();

  for (const vote of voteRows) {
    const existing = summaries.get(vote.log_id) ?? createEmptyVoteSummary();

    if (vote.value === 1) {
      existing.upvotes += 1;
    }

    if (vote.value === -1) {
      existing.downvotes += 1;
    }

    if (viewerId && vote.user_id === viewerId) {
      existing.viewerVote = vote.value as VoteSummary["viewerVote"];
    }

    existing.score = existing.upvotes - existing.downvotes;
    summaries.set(vote.log_id, existing);
  }

  return summaries;
}

function summarizeCommentVotes(
  voteRows: PriceLogCommentVoteRecord[],
  viewerId: string | null,
): Map<string, VoteSummary> {
  const summaries = new Map<string, VoteSummary>();

  for (const vote of voteRows) {
    const existing = summaries.get(vote.comment_id) ?? createEmptyVoteSummary();

    if (vote.value === 1) {
      existing.upvotes += 1;
    }

    if (vote.value === -1) {
      existing.downvotes += 1;
    }

    if (viewerId && vote.user_id === viewerId) {
      existing.viewerVote = vote.value as VoteSummary["viewerVote"];
    }

    existing.score = existing.upvotes - existing.downvotes;
    summaries.set(vote.comment_id, existing);
  }

  return summaries;
}

function buildCompareEntries(logs: PriceLogWithRelations[], selectedItem: ItemRecord) {
  const seenStores = new Set<string>();
  const entries: CompareEntry[] = [];
  const sortedLogs = [...logs].sort(sortLogsByRecency);

  for (const log of sortedLogs) {
    if (seenStores.has(log.store_id) || !log.stores) {
      continue;
    }

    seenStores.add(log.store_id);

    entries.push({
      history: sortedLogs
        .filter((candidate) => candidate.store_id === log.store_id)
        .map(stripRelations),
      item: selectedItem,
      latestLog: stripRelations(log),
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

function buildLogFeedEntries(
  logs: PriceLogWithRelations[],
  voteSummaries: Map<string, VoteSummary>,
  viewerId: string | null,
) {
  return [...logs].sort(sortLogsByRecency).flatMap((log) => {
    if (!log.items || !log.stores) {
      return [];
    }

    return [
      {
        canEdit: viewerId === log.submitted_by,
        item: log.items,
        log: stripRelations(log),
        store: log.stores,
        voteSummary: voteSummaries.get(log.id) ?? createEmptyVoteSummary(),
      } satisfies PriceLogListEntry,
    ];
  });
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

function buildCommentEntries(
  comments: PriceLogCommentRow[],
  authorLabels: Map<string, string>,
  voteSummaries: Map<string, VoteSummary>,
) {
  return [...comments]
    .sort((left, right) => {
      const leftSummary = voteSummaries.get(left.id) ?? createEmptyVoteSummary();
      const rightSummary = voteSummaries.get(right.id) ?? createEmptyVoteSummary();

      if (leftSummary.score === rightSummary.score) {
        return left.created_at.localeCompare(right.created_at);
      }

      return rightSummary.score - leftSummary.score;
    })
    .map((comment) => ({
      authorLabel: authorLabels.get(comment.author_id) ?? "User",
      comment: {
        author_id: comment.author_id,
        body: comment.body,
        created_at: comment.created_at,
        id: comment.id,
        log_id: comment.log_id,
      } satisfies PriceLogCommentRecord,
      voteSummary: voteSummaries.get(comment.id) ?? createEmptyVoteSummary(),
    } satisfies CommentThreadEntry));
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

  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as StoreRecord[];
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
        created_at,
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

export async function getPriceLogsSnapshot(): Promise<PriceLogsSnapshot> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      allLogs: getDemoLogsFeed(null),
      isConfigured: false,
      isDemo: true,
      ownLogs: [],
      viewer: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewer = toViewer(user);

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
      `,
    );

  if (error) {
    throw new Error(error.message);
  }

  const logs = (data ?? []) as unknown as PriceLogWithRelations[];
  const votes = await getVoteRowsForLogs(logs.map((log) => log.id));
  const voteSummaries = summarizeVotes(votes, viewer?.id ?? null);
  const allLogs = buildLogFeedEntries(logs, voteSummaries, viewer?.id ?? null);

  return {
    allLogs,
    isConfigured: true,
    isDemo: false,
    ownLogs: viewer ? allLogs.filter((entry) => entry.log.submitted_by === viewer.id) : [],
    viewer: viewer ?? null,
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
      `,
    )
    .eq("id", logId)
    .single();

  if (error || !data) {
    return null;
  }

  const log = data as unknown as PriceLogDetailRow;

  if (!log.items || !log.stores) {
    return null;
  }

  const { data: historyData, error: historyError } = await supabase
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
      `,
    )
    .eq("item_id", log.item_id);

  if (historyError) {
    throw new Error(historyError.message);
  }

  const itemLogs = (historyData ?? []) as unknown as PriceLogWithRelations[];
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
  const sameStoreHistory = itemLogs
    .filter((candidate) => candidate.store_id === log.store_id)
    .sort(sortLogsByRecency)
    .map(stripRelations);

  return {
    canEdit: viewer?.id === log.submitted_by,
    comments: buildCommentEntries(comments, authorLabels, commentVoteSummaries),
    item: log.items,
    latestAcrossStores: await getComparisonSnapshot(log.item_id).then(
      (snapshot) => snapshot.entries,
    ),
    log: stripRelations(log),
    recentItemLogs: buildLogFeedEntries(itemLogs, voteSummaries, viewer?.id ?? null),
    sameStoreHistory,
    store: log.stores,
    viewer: viewer ?? null,
    voteSummary: voteSummaries.get(log.id) ?? createEmptyVoteSummary(),
  };
}
