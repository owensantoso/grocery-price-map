import { PRICE_LOG_PHOTO_BUCKET } from "@/lib/photos";

export type PhotoCleanupReason =
  | "create_insert_failed"
  | "update_failed"
  | "update_replaced"
  | "delete_succeeded";

type PhotoRemoveResult = {
  error?: { message: string } | null;
};

export async function removePriceLogPhotoBestEffort(input: {
  logFailure?: (details: {
    bucket: string;
    error: string;
    event: "price_log_photo_cleanup_failed";
    logId: string | null;
    path: string;
    reason: PhotoCleanupReason;
  }) => void;
  logId?: string;
  path: string | null;
  reason: PhotoCleanupReason;
  remove: (path: string) => Promise<PhotoRemoveResult>;
}) {
  const { logFailure = console.error, logId, path, reason, remove } = input;

  if (!path) {
    return { removed: false };
  }

  let result: PhotoRemoveResult;

  try {
    result = await remove(path);
  } catch (error) {
    logFailure({
      bucket: PRICE_LOG_PHOTO_BUCKET,
      error: error instanceof Error ? error.message : "Unknown photo cleanup error",
      event: "price_log_photo_cleanup_failed",
      logId: logId ?? null,
      path,
      reason,
    });

    return { removed: false };
  }

  const { error } = result;

  if (error) {
    logFailure({
      bucket: PRICE_LOG_PHOTO_BUCKET,
      error: error.message,
      event: "price_log_photo_cleanup_failed",
      logId: logId ?? null,
      path,
      reason,
    });

    return { removed: false };
  }

  return { removed: true };
}
