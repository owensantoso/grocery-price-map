import { describe, expect, it } from "vitest";
import { getDemoCompareEntries } from "./demo-data";

describe("getDemoCompareEntries", () => {
  it("returns latest log per store sorted by normalized price", () => {
    const entries = getDemoCompareEntries("item-eggs");

    expect(entries).toHaveLength(3);
    expect(entries[0]?.store.name).toBe("Niku no Hanamasa Honancho");
    expect(entries[0]?.latestLog.observed_at).toBe("2026-03-19");
    expect(entries[1]?.store.name).toBe("Gyomu Super Nakano");
    expect(entries[2]?.store.name).toBe("Summit Nishi-Eifuku");
    expect(entries[2]?.history).toHaveLength(2);
  });
});
