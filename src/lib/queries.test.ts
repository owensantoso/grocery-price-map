import { describe, expect, it } from "vitest";
import type { ItemRecord, PriceLogVoteRecord, StoreRecord } from "./models";
import {
  buildCompareEntries,
  buildLogFeedEntries,
  sortFeedEntries,
  summarizeVotes,
  type PriceLogWithRelations,
} from "./queries";

const item: ItemRecord = {
  category: "Dairy",
  comparison_basis_amount: 100,
  comparison_unit: "g",
  created_at: "2026-03-01T00:00:00.000Z",
  created_by: "user-owner",
  id: "item-tofu",
  name: "Tofu",
};

const storeA: StoreRecord = {
  address_text: "A address",
  chain_name: null,
  created_at: "2026-03-01T00:00:00.000Z",
  created_by: "user-owner",
  id: "store-a",
  latitude: 35.1,
  longitude: 139.1,
  name: "Store A",
  notes: null,
  store_kind: "physical",
  store_url: "https://example.com/a",
};

const storeB: StoreRecord = {
  ...storeA,
  id: "store-b",
  name: "Store B",
  store_url: "https://example.com/b",
};

function logFixture(
  overrides: Partial<PriceLogWithRelations> & Pick<PriceLogWithRelations, "id" | "store_id">,
): PriceLogWithRelations {
  const store = overrides.store_id === storeB.id ? storeB : storeA;

  return {
    created_at: "2026-03-10T10:00:00.000Z",
    id: overrides.id,
    item_id: item.id,
    items: item,
    listing_url: null,
    normalized_price_yen: 100,
    notes: null,
    observed_at: "2026-03-10",
    package_amount: 300,
    package_unit: "g",
    photo_path: null,
    price_tax_excluded_yen: 278,
    store_id: overrides.store_id,
    stores: store,
    submitted_by: "user-owner",
    total_price_yen: 300,
    ...overrides,
  };
}

describe("query read-model helpers", () => {
  it("summarizes votes and records the viewer vote", () => {
    const votes: PriceLogVoteRecord[] = [
      {
        created_at: "2026-03-10T10:00:00.000Z",
        log_id: "log-1",
        user_id: "viewer",
        value: 1,
      },
      {
        created_at: "2026-03-10T10:01:00.000Z",
        log_id: "log-1",
        user_id: "other",
        value: -1,
      },
      {
        created_at: "2026-03-10T10:02:00.000Z",
        log_id: "log-1",
        user_id: "third",
        value: 1,
      },
    ];

    expect(summarizeVotes(votes, "viewer").get("log-1")).toEqual({
      downvotes: 1,
      score: 1,
      upvotes: 2,
      viewerVote: 1,
    });
  });

  it("builds compare entries from the latest log per store, then sorts by price", () => {
    const entries = buildCompareEntries(
      [
        logFixture({
          created_at: "2026-03-10T08:00:00.000Z",
          id: "older-cheap-a",
          normalized_price_yen: 80,
          observed_at: "2026-03-10",
          store_id: storeA.id,
        }),
        logFixture({
          created_at: "2026-03-12T08:00:00.000Z",
          id: "latest-expensive-a",
          normalized_price_yen: 130,
          observed_at: "2026-03-12",
          store_id: storeA.id,
        }),
        logFixture({
          created_at: "2026-03-11T08:00:00.000Z",
          id: "latest-b",
          normalized_price_yen: 100,
          observed_at: "2026-03-11",
          store_id: storeB.id,
        }),
      ],
      item,
      new Map(),
      "user-owner",
    );

    expect(entries.map((entry) => entry.latestLog.id)).toEqual([
      "latest-b",
      "latest-expensive-a",
    ]);
    expect(entries[1]?.history.map((entry) => entry.log.id)).toEqual([
      "latest-expensive-a",
      "older-cheap-a",
    ]);
  });

  it("sorts feed entries by requested sort with recent tie-breakers", () => {
    const feedEntries = buildLogFeedEntries(
      [
        logFixture({
          created_at: "2026-03-10T08:00:00.000Z",
          id: "less-upvoted-newer",
          observed_at: "2026-03-12",
          store_id: storeA.id,
          submitted_by: "viewer",
        }),
        logFixture({
          created_at: "2026-03-09T08:00:00.000Z",
          id: "more-upvoted-older",
          observed_at: "2026-03-11",
          store_id: storeB.id,
        }),
      ],
      new Map([
        [
          "less-upvoted-newer",
          { downvotes: 0, score: 1, upvotes: 1, viewerVote: 1 },
        ],
        [
          "more-upvoted-older",
          { downvotes: 0, score: 3, upvotes: 3, viewerVote: 0 },
        ],
      ]),
      "viewer",
    );

    expect(feedEntries.find((entry) => entry.log.id === "less-upvoted-newer")?.canEdit).toBe(
      true,
    );
    expect(sortFeedEntries(feedEntries, "upvoted").map((entry) => entry.log.id)).toEqual([
      "more-upvoted-older",
      "less-upvoted-newer",
    ]);
    expect(sortFeedEntries(feedEntries, "recent").map((entry) => entry.log.id)).toEqual([
      "less-upvoted-newer",
      "more-upvoted-older",
    ]);
  });
});
