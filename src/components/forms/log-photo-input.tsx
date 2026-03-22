/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState } from "react";
import {
  MAX_PHOTO_BYTES,
  MAX_PHOTO_WIDTH,
  PHOTO_QUALITY,
  SERVER_ACTION_BODY_BYTES,
} from "@/lib/photos";

type LogPhotoInputProps = {
  existingPhotoUrl?: string | null;
};

async function compressImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_PHOTO_WIDTH / bitmap.width);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare image compression.");
  }

  context.drawImage(bitmap, 0, 0, width, height);

  return canvas.toDataURL("image/webp", PHOTO_QUALITY);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function estimateDataUrlBytes(dataUrl: string) {
  const payload = dataUrl.split(",", 2)[1] ?? "";
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;

  return Math.max(0, Math.floor((payload.length * 3) / 4) - padding);
}

export function LogPhotoInput({ existingPhotoUrl }: LogPhotoInputProps) {
  const [previewUrl, setPreviewUrl] = useState(existingPhotoUrl ?? "");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [originalFileSize, setOriginalFileSize] = useState<number | null>(null);
  const [compressedBytes, setCompressedBytes] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const encodedLength = photoDataUrl.length;
  const nearingStorageLimit =
    compressedBytes !== null && compressedBytes > MAX_PHOTO_BYTES * 0.85;
  const nearingBodyLimit =
    encodedLength > 0 && encodedLength > SERVER_ACTION_BODY_BYTES * 0.8;
  const likelyTooLarge =
    compressedBytes !== null && compressedBytes > MAX_PHOTO_BYTES;

  return (
    <div className="form-field form-field--wide">
      <span>Photo (optional)</span>
      <input name="photoDataUrl" type="hidden" value={photoDataUrl} />
      <div className="photo-input">
        <input
          accept="image/*"
          className="input"
          onChange={async (event) => {
            const file = event.target.files?.[0];

            if (!file) {
              return;
            }

            try {
              setOriginalFileSize(file.size);
              const compressed = await compressImage(file);
              const nextCompressedBytes = estimateDataUrlBytes(compressed);
              setPhotoDataUrl(compressed);
              setPreviewUrl(compressed);
              setCompressedBytes(nextCompressedBytes);
              setStatusMessage(
                nextCompressedBytes > MAX_PHOTO_BYTES
                  ? "Compressed image still looks too large. Try a tighter crop or a simpler photo."
                  : "Compressed to a smaller WebP image for upload.",
              );
            } catch {
              setOriginalFileSize(file.size);
              setCompressedBytes(null);
              setStatusMessage("Could not process this image.");
            }
          }}
          ref={inputRef}
          type="file"
        />
        {photoDataUrl ? (
          <button
            className="button button-secondary"
            onClick={() => {
              setPhotoDataUrl("");
              setPreviewUrl(existingPhotoUrl ?? "");
              setStatusMessage("");
              setOriginalFileSize(null);
              setCompressedBytes(null);

              if (inputRef.current) {
                inputRef.current.value = "";
              }
            }}
            type="button"
          >
            Clear new photo
          </button>
        ) : null}
      </div>
      <p className="field-help">
        Images are resized to max 600px wide and stored as compressed WebP to keep
        storage and bandwidth down.
      </p>
      {originalFileSize !== null || compressedBytes !== null ? (
        <div className="photo-debug">
          {originalFileSize !== null ? (
            <p className="field-help">Original file: {formatBytes(originalFileSize)}</p>
          ) : null}
          {compressedBytes !== null ? (
            <p className="field-help">
              Compressed image: {formatBytes(compressedBytes)} / limit {formatBytes(MAX_PHOTO_BYTES)}
            </p>
          ) : null}
          {photoDataUrl ? (
            <p className="field-help">
              Form payload contribution: {formatBytes(encodedLength)} / approx body limit{" "}
              {formatBytes(SERVER_ACTION_BODY_BYTES)}
            </p>
          ) : null}
          {likelyTooLarge ? (
            <p className="field-help field-help--warning">
              This photo is currently over the upload size limit and will fail.
            </p>
          ) : null}
          {!likelyTooLarge && nearingStorageLimit ? (
            <p className="field-help field-help--warning">
              This photo is close to the stored-image limit. Tight crops work more reliably.
            </p>
          ) : null}
          {!likelyTooLarge && nearingBodyLimit ? (
            <p className="field-help field-help--warning">
              This photo is close to the form body limit and may fail on upload.
            </p>
          ) : null}
        </div>
      ) : null}
      {statusMessage ? <p className="field-help">{statusMessage}</p> : null}
      {previewUrl ? (
        <div className="log-photo-preview">
          <img alt="Selected log photo preview" className="log-photo__image" src={previewUrl} />
        </div>
      ) : null}
    </div>
  );
}
