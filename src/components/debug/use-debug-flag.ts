"use client";

import { useSearchParams } from "next/navigation";

export function useDebugFlag() {
  const searchParams = useSearchParams();

  return searchParams.get("debug") === "1";
}
