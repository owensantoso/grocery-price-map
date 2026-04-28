import { randomUUID } from "node:crypto";
import {
  createDiagnosticContext,
  emitDiagnosticEvent,
  startDiagnosticSpan,
  type DiagnosticContext,
} from "@/lib/diagnostics";
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
  diagnostics?: DiagnosticContext;
  photoDataUrl?: string | null;
  supabase: AuthedSupabase;
  userId: string;
}) {
  const { diagnostics, photoDataUrl, supabase, userId } = input;

  if (!photoDataUrl) {
    return null;
  }

  const payloadLimit = Math.ceil((MAX_PHOTO_BYTES * 4) / 3) + 512_000;
  const context =
    diagnostics ??
    createDiagnosticContext({
      component: "price_log_photo",
      operation: "upload",
    });
  const span = startDiagnosticSpan(context, {
    attrs: {
      inputSizeBytes: photoDataUrl.length,
      payloadLimit,
    },
    event: "price_log_photo_upload",
  });
  let uploadFailureLogged = false;

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
      uploadFailureLogged = true;
      span.error(error, {
        attrs: {
          bucket: PRICE_LOG_PHOTO_BUCKET,
          contentType,
          decodedBytes: buffer.byteLength,
          inputSizeBytes: photoDataUrl.length,
          objectPathPresent: Boolean(path),
        },
        event: "price_log_photo_upload_failed",
      });
      throw new Error(`Photo upload failed: ${error.message}`);
    }

    span.end({
      attrs: {
        contentType,
        decodedBytes: buffer.byteLength,
        objectPathPresent: Boolean(path),
      },
    });
    return path;
  } catch (error) {
    if (!uploadFailureLogged) {
      span.error(error, {
        attrs: {
          inputSizeBytes: photoDataUrl.length,
          payloadLimit,
        },
        event: "price_log_photo_prepare_failed",
      });
    }
    throw error instanceof Error
      ? error
      : new Error("Photo upload failed before it could be saved.");
  }
}

export async function removePriceLogPhoto(input: {
  diagnostics?: DiagnosticContext;
  logId?: string;
  path: string | null;
  reason: PhotoCleanupReason;
  supabase: AuthedSupabase;
}) {
  const { diagnostics, logId, path, reason, supabase } = input;
  const context =
    diagnostics ??
    createDiagnosticContext({
      component: "price_log_photo",
      operation: "cleanup",
    });

  await removePriceLogPhotoBestEffort({
    logFailure: (details) =>
      emitDiagnosticEvent({
        ...context,
        attrs: {
          bucket: details.bucket,
          error_message: details.error,
          logId: details.logId,
          objectPathPresent: Boolean(details.path),
          reason: details.reason,
        },
        event: details.event,
        eventKind: "error",
        level: "error",
        outcome: "error",
        spanId: `span-${randomUUID()}`,
      }),
    logId,
    path,
    reason,
    remove: async (pathToRemove) =>
      supabase.storage.from(PRICE_LOG_PHOTO_BUCKET).remove([pathToRemove]),
  });
}
