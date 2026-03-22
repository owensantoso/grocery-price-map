export const PRICE_LOG_PHOTO_BUCKET = "price-log-photos";
export const MAX_PHOTO_WIDTH = 600;
export const PHOTO_QUALITY = 0.48;

export function dataUrlToBuffer(dataUrl: string) {
  const [header, payload] = dataUrl.split(",", 2);

  if (!header || !payload || !header.startsWith("data:")) {
    throw new Error("Photo data is invalid.");
  }

  const mimeMatch = header.match(/^data:(.+);base64$/);

  if (!mimeMatch) {
    throw new Error("Photo format is invalid.");
  }

  return {
    buffer: Buffer.from(payload, "base64"),
    contentType: mimeMatch[1],
  };
}

export function getPhotoUrl(path: string | null) {
  if (!path || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }

  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PRICE_LOG_PHOTO_BUCKET}/${path}`;
}
