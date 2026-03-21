import type { Database } from "@/lib/database.types";

export type Viewer = {
  email: string;
  id: string;
};

export type ItemRecord = Database["public"]["Tables"]["items"]["Row"];
export type StoreRecord = Database["public"]["Tables"]["stores"]["Row"];
export type PriceLogRecord = Database["public"]["Tables"]["price_logs"]["Row"];

export type CompareEntry = {
  history: PriceLogRecord[];
  item: ItemRecord;
  latestLog: PriceLogRecord;
  store: StoreRecord;
};
