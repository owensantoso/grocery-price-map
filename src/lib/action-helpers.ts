import { revalidateTag } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message: string;
  status: "error" | "idle";
};

export type VoteActionState = {
  message: string;
  status: "error" | "idle";
};

export const RATE_LIMIT_RULES = {
  commentCreate: { action: "comment-create", limit: 12, windowMs: 60_000 },
  commentVote: { action: "comment-vote", limit: 60, windowMs: 60_000 },
  itemCreate: { action: "item-create", limit: 12, windowMs: 3_600_000 },
  logCreate: { action: "log-create", limit: 30, windowMs: 3_600_000 },
  logEdit: { action: "log-edit", limit: 60, windowMs: 3_600_000 },
  logVote: { action: "log-vote", limit: 60, windowMs: 60_000 },
  profileUpdate: { action: "profile-update", limit: 10, windowMs: 3_600_000 },
  storeCreate: { action: "store-create", limit: 12, windowMs: 3_600_000 },
} as const;

function formatRateLimitWindow(windowMs: number) {
  const minutes = Math.round(windowMs / 60_000);

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  const hours = Math.round(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

export async function consumeRateLimit(input: {
  action: string;
  limit: number;
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
  userId: string;
  windowMs: number;
}) {
  const { action, limit, supabase, windowMs } = input;
  const windowSeconds = Math.ceil(windowMs / 1_000);
  const { data: accepted, error } = await supabase.rpc(
    "consume_action_rate_limit",
    {
      action_name: action,
      max_events: limit,
      window_seconds: windowSeconds,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!accepted) {
    throw new Error(
      `Rate limit reached for this action. Try again in ${formatRateLimitWindow(windowMs)}.`,
    );
  }
}

export function getConfiguredSiteUrl(headerOrigin: string | null) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (siteUrl) {
    return siteUrl;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL must be set in production.");
  }

  return headerOrigin ?? "http://localhost:3000";
}

export function toActionState(
  error: unknown,
  fieldErrors?: Record<string, string[] | undefined>,
) {
  return {
    fieldErrors,
    message: error instanceof Error ? error.message : "Something went wrong.",
    status: "error" as const,
  };
}

export function rethrowIfRedirectError(error: unknown) {
  if (isRedirectError(error)) {
    throw error;
  }
}

export function revalidateSharedItems() {
  revalidateTag("items", "max");
}

export function revalidateSharedStores() {
  revalidateTag("stores", "max");
}

export function revalidatePriceLogCaches(input?: {
  itemId?: string | null;
  logId?: string | null;
  storeId?: string | null;
}) {
  revalidateTag("price-logs", "max");

  if (input?.itemId) {
    revalidateTag(`price-logs:item:${input.itemId}`, "max");
  }

  if (input?.storeId) {
    revalidateTag(`price-logs:store:${input.storeId}`, "max");
  }

  if (input?.logId) {
    revalidateTag(`price-log:${input.logId}`, "max");
  }
}

export async function requireAuthedClient() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase is not configured. Add your env vars first.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You need to sign in before making changes.");
  }

  return { supabase, user };
}
