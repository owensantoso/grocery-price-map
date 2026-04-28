import type {
  CommentThreadEntry,
  CompareEntry,
  ItemRecord,
  PriceLogCommentRecord,
  PriceLogCommentVoteRecord,
  PriceLogListEntry,
  PriceLogRecord,
  PriceLogVoteRecord,
  StoreRecord,
  VoteSummary,
} from "@/lib/models";

export type PriceLogSort =
  | "cheapest"
  | "downvoted"
  | "expensive"
  | "oldest"
  | "recent"
  | "upvoted";

export type PriceLogWithRelations = {
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

export type PriceLogCommentRow = {
  author_id: string;
  body: string;
  created_at: string;
  id: string;
  log_id: string;
};

export function stripRelations(log: PriceLogWithRelations): PriceLogRecord {
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

export function createEmptyVoteSummary(): VoteSummary {
  return {
    downvotes: 0,
    score: 0,
    upvotes: 0,
    viewerVote: 0,
  };
}

export function summarizeVotes(
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

export function summarizeCommentVotes(
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

export function buildCompareEntries(
  logs: PriceLogWithRelations[],
  selectedItem: ItemRecord,
  voteSummaries: Map<string, VoteSummary>,
  viewerId: string | null,
) {
  const seenStores = new Set<string>();
  const entries: CompareEntry[] = [];
  const sortedLogs = [...logs].sort(sortLogsByRecency);

  for (const log of sortedLogs) {
    if (seenStores.has(log.store_id) || !log.stores) {
      continue;
    }

    seenStores.add(log.store_id);

    entries.push({
      history: buildLogFeedEntries(
        sortedLogs.filter((candidate) => candidate.store_id === log.store_id),
        voteSummaries,
        viewerId,
      ),
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

export function buildLogFeedEntries(
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

function compareFeedEntries(left: PriceLogListEntry, right: PriceLogListEntry, sort: PriceLogSort) {
  switch (sort) {
    case "oldest":
      if (left.log.observed_at === right.log.observed_at) {
        return left.log.created_at.localeCompare(right.log.created_at);
      }

      return left.log.observed_at.localeCompare(right.log.observed_at);
    case "upvoted":
      if (right.voteSummary.upvotes === left.voteSummary.upvotes) {
        return compareFeedEntries(left, right, "recent");
      }

      return right.voteSummary.upvotes - left.voteSummary.upvotes;
    case "downvoted":
      if (right.voteSummary.downvotes === left.voteSummary.downvotes) {
        return compareFeedEntries(left, right, "recent");
      }

      return right.voteSummary.downvotes - left.voteSummary.downvotes;
    case "cheapest":
      if (left.log.normalized_price_yen === right.log.normalized_price_yen) {
        return compareFeedEntries(left, right, "recent");
      }

      return left.log.normalized_price_yen - right.log.normalized_price_yen;
    case "expensive":
      if (left.log.normalized_price_yen === right.log.normalized_price_yen) {
        return compareFeedEntries(left, right, "recent");
      }

      return right.log.normalized_price_yen - left.log.normalized_price_yen;
    case "recent":
    default:
      if (left.log.observed_at === right.log.observed_at) {
        return right.log.created_at.localeCompare(left.log.created_at);
      }

      return right.log.observed_at.localeCompare(left.log.observed_at);
  }
}

export function sortFeedEntries(entries: PriceLogListEntry[], sort: PriceLogSort) {
  return [...entries].sort((left, right) => compareFeedEntries(left, right, sort));
}

export function buildCommentEntries(
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
