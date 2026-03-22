import type { Database } from "@/lib/database.types";

export type Viewer = {
  email: string;
  id: string;
};

export type ItemRecord = Database["public"]["Tables"]["items"]["Row"];
export type StoreRecord = Database["public"]["Tables"]["stores"]["Row"];
export type PriceLogRecord = Database["public"]["Tables"]["price_logs"]["Row"];
export type PriceLogVoteRecord = Database["public"]["Tables"]["price_log_votes"]["Row"];
export type PriceLogCommentRecord =
  Database["public"]["Tables"]["price_log_comments"]["Row"];
export type PriceLogCommentVoteRecord =
  Database["public"]["Tables"]["price_log_comment_votes"]["Row"];

export type VoteSummary = {
  downvotes: number;
  score: number;
  upvotes: number;
  viewerVote: -1 | 0 | 1;
};

export type CommentThreadEntry = {
  authorLabel: string;
  comment: PriceLogCommentRecord;
  voteSummary: VoteSummary;
};

export type PriceLogListEntry = {
  canEdit: boolean;
  item: ItemRecord;
  log: PriceLogRecord;
  store: StoreRecord;
  voteSummary: VoteSummary;
};

export type CompareEntry = {
  history: PriceLogRecord[];
  item: ItemRecord;
  latestLog: PriceLogRecord;
  store: StoreRecord;
};

export type LogDetail = {
  canEdit: boolean;
  comments: CommentThreadEntry[];
  item: ItemRecord;
  latestAcrossStores: CompareEntry[];
  log: PriceLogRecord;
  recentItemLogs: PriceLogListEntry[];
  sameStoreHistory: PriceLogRecord[];
  store: StoreRecord;
  voteSummary: VoteSummary;
};
