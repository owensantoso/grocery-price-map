"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { PriceLogSort } from "@/lib/queries";

type LogSortControlProps = {
  options: Array<{ label: string; value: PriceLogSort }>;
  selectedSort: PriceLogSort;
};

export function LogSortControl({ options, selectedSort }: LogSortControlProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(nextSort: PriceLogSort) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextSort === "recent") {
      params.delete("sort");
    } else {
      params.set("sort", nextSort);
    }

    const query = params.toString();
    router.replace(query ? `/logs?${query}` : "/logs");
  }

  return (
    <div className="sort-control">
      <label className="form-field">
        <span>Sort by</span>
        <select
          className="select"
          name="sort"
          onChange={(event) => handleChange(event.target.value as PriceLogSort)}
          value={selectedSort}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
