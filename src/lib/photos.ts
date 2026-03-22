export const PRICE_LOG_PHOTO_BUCKET = "price-log-photos";
export const MAX_PHOTO_WIDTH = 400;
export const WEBP_PHOTO_QUALITY = 0.3;
export const JPEG_FALLBACK_QUALITY = 0.45;
export const MAX_PHOTO_BYTES = 1_000_000;
export const SERVER_ACTION_BODY_SIZE_LIMIT = "3mb";
export const SERVER_ACTION_BODY_BYTES = 3 * 1024 * 1024;
export const ALLOWED_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function dataUrlToBuffer(dataUrl: string) {
  const [header, payload] = dataUrl.split(",", 2);

  if (!header || !payload || !header.startsWith("data:")) {
    throw new Error("Photo data is invalid.");
  }

  const mimeMatch = header.match(/^data:(.+);base64$/);

  if (!mimeMatch) {
    throw new Error("Photo format is invalid.");
  }

  if (
    !ALLOWED_PHOTO_MIME_TYPES.includes(
      mimeMatch[1] as (typeof ALLOWED_PHOTO_MIME_TYPES)[number],
    )
  ) {
    throw new Error("Only JPEG, PNG, and WebP images are allowed.");
  }

  const buffer = Buffer.from(payload, "base64");

  if (buffer.byteLength > MAX_PHOTO_BYTES) {
    throw new Error("Photo is too large after compression.");
  }

  return {
    buffer,
    contentType: mimeMatch[1],
  };
}

export function getPhotoUrl(path: string | null) {
  if (!path || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }

  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PRICE_LOG_PHOTO_BUCKET}/${path}`;
}
