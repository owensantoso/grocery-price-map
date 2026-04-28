import { randomUUID } from "node:crypto";
import {
  dataUrlToBuffer,
  MAX_PHOTO_BYTES,
  PRICE_LOG_PHOTO_BUCKET,
} from "@/lib/photos";
import {
  removePriceLogPhotoBestEffort,
  type PhotoCleanupReason,
} from "@/lib/photo-mutation-compensation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuthedSupabase = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export async function uploadPhotoIfPresent(input: {
  photoDataUrl?: string | null;
  supabase: AuthedSupabase;
  userId: string;
}) {
  const { photoDataUrl, supabase, userId } = input;

  if (!photoDataUrl) {
    return null;
  }

  const payloadLimit = Math.ceil((MAX_PHOTO_BYTES * 4) / 3) + 512_000;

  try {
    // Guard against oversized payloads before base64 decode to keep memory use bounded.
    if (photoDataUrl.length > payloadLimit) {
      throw new Error(
        "Photo payload is too large for upload. Try a tighter crop or a simpler image.",
      );
    }

    const { buffer, contentType } = dataUrlToBuffer(photoDataUrl);
    const extension = contentType === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/${randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from(PRICE_LOG_PHOTO_BUCKET)
      .upload(path, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error("Photo storage upload failed", {
        bodyPayloadLength: photoDataUrl.length,
        bucket: PRICE_LOG_PHOTO_BUCKET,
        contentType,
        decodedBytes: buffer.byteLength,
        error: error.message,
        path,
        userId,
      });
      throw new Error(`Photo upload failed: ${error.message}`);
    }

    return path;
  } catch (error) {
    console.error("Photo decode/upload failed", {
      bodyPayloadLength: photoDataUrl.length,
      message: error instanceof Error ? error.message : "Unknown photo error",
      payloadLimit,
      userId,
    });
    throw error instanceof Error
      ? error
      : new Error("Photo upload failed before it could be saved.");
  }
}

export async function removePriceLogPhoto(input: {
  logId?: string;
  path: string | null;
  reason: PhotoCleanupReason;
  supabase: AuthedSupabase;
}) {
  const { logId, path, reason, supabase } = input;

  await removePriceLogPhotoBestEffort({
    logFailure: (details) => console.error("Photo cleanup failed", details),
    logId,
    path,
    reason,
    remove: async (pathToRemove) =>
      supabase.storage.from(PRICE_LOG_PHOTO_BUCKET).remove([pathToRemove]),
  });
}
