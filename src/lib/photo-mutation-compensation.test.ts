import { describe, expect, it, vi } from "vitest";
import { PRICE_LOG_PHOTO_BUCKET } from "./photos";
import { removePriceLogPhotoBestEffort } from "./photo-mutation-compensation";

describe("photo mutation compensation", () => {
  it("removes uploaded photos during compensated failure cleanup", async () => {
    const remove = vi.fn().mockResolvedValue({ error: null });

    await expect(
      removePriceLogPhotoBestEffort({
        path: "user-1/new-photo.webp",
        reason: "create_insert_failed",
        remove,
      }),
    ).resolves.toEqual({ removed: true });

    expect(remove).toHaveBeenCalledWith("user-1/new-photo.webp");
  });

  it("logs cleanup failures without throwing", async () => {
    const logFailure = vi.fn();
    const remove = vi.fn().mockResolvedValue({
      error: { message: "storage is unavailable" },
    });

    await expect(
      removePriceLogPhotoBestEffort({
        logFailure,
        logId: "log-1",
        path: "user-1/orphaned-photo.webp",
        reason: "delete_succeeded",
        remove,
      }),
    ).resolves.toEqual({ removed: false });

    expect(logFailure).toHaveBeenCalledWith({
      bucket: PRICE_LOG_PHOTO_BUCKET,
      error: "storage is unavailable",
      logId: "log-1",
      path: "user-1/orphaned-photo.webp",
      reason: "delete_succeeded",
    });
  });

  it("logs thrown cleanup failures without throwing", async () => {
    const logFailure = vi.fn();
    const remove = vi.fn().mockRejectedValue(new Error("network dropped"));

    await expect(
      removePriceLogPhotoBestEffort({
        logFailure,
        logId: "log-1",
        path: "user-1/orphaned-photo.webp",
        reason: "update_replaced",
        remove,
      }),
    ).resolves.toEqual({ removed: false });

    expect(logFailure).toHaveBeenCalledWith({
      bucket: PRICE_LOG_PHOTO_BUCKET,
      error: "network dropped",
      logId: "log-1",
      path: "user-1/orphaned-photo.webp",
      reason: "update_replaced",
    });
  });

  it("returns false for unknown thrown cleanup failures", async () => {
    const logFailure = vi.fn();
    const remove = vi.fn().mockRejectedValue("storage failed");

    await expect(
      removePriceLogPhotoBestEffort({
        logFailure,
        path: "user-1/orphaned-photo.webp",
        reason: "delete_succeeded",
        remove,
      }),
    ).resolves.toEqual({ removed: false });

    expect(logFailure).toHaveBeenCalledWith({
      bucket: PRICE_LOG_PHOTO_BUCKET,
      error: "Unknown photo cleanup error",
      logId: null,
      path: "user-1/orphaned-photo.webp",
      reason: "delete_succeeded",
    });
  });

  it("does nothing when there is no photo path", async () => {
    const remove = vi.fn();

    await expect(
      removePriceLogPhotoBestEffort({
        path: null,
        reason: "update_failed",
        remove,
      }),
    ).resolves.toEqual({ removed: false });

    expect(remove).not.toHaveBeenCalled();
  });
});
