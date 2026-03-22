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

type CompressedImageResult = {
  byteLength: number;
  dataUrl: string;
  height: number;
  mimeType: string;
  width: number;
};

async function blobToDataUrl(blob: Blob) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read compressed image."));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Compressed image could not be serialized."));
        return;
      }

      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });
}

async function loadImageElement(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Could not load image for compression."));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function compressImage(file: File): Promise<CompressedImageResult> {
  const image = await loadImageElement(file);
  const scale = Math.min(1, MAX_PHOTO_WIDTH / image.width);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare image compression.");
  }

  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", PHOTO_QUALITY);
  });

  if (!blob) {
    throw new Error("Could not encode this image as WebP.");
  }

  if (blob.type !== "image/webp") {
    throw new Error("This browser did not produce a WebP image.");
  }

  return {
    byteLength: blob.size,
    dataUrl: await blobToDataUrl(blob),
    height,
    mimeType: blob.type,
    width,
  };
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

export function LogPhotoInput({ existingPhotoUrl }: LogPhotoInputProps) {
  const [previewUrl, setPreviewUrl] = useState(existingPhotoUrl ?? "");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [originalFileSize, setOriginalFileSize] = useState<number | null>(null);
  const [compressedBytes, setCompressedBytes] = useState<number | null>(null);
  const [compressedType, setCompressedType] = useState<string | null>(null);
  const [outputDimensions, setOutputDimensions] = useState<string>("");
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
              const nextCompressedBytes = compressed.byteLength;
              setPhotoDataUrl(compressed.dataUrl);
              setPreviewUrl(compressed.dataUrl);
              setCompressedBytes(nextCompressedBytes);
              setCompressedType(compressed.mimeType);
              setOutputDimensions(`${compressed.width}×${compressed.height}`);
              setStatusMessage(
                nextCompressedBytes > MAX_PHOTO_BYTES
                  ? "Compressed image still looks too large. Try a tighter crop or a simpler photo."
                  : "Compressed to WebP for upload.",
              );
            } catch {
              setOriginalFileSize(file.size);
              setCompressedBytes(null);
              setCompressedType(null);
              setOutputDimensions("");
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
              setCompressedType(null);
              setOutputDimensions("");

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
        Images are resized to max 400px wide and stored as compressed WebP to keep
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
          {compressedType || outputDimensions ? (
            <p className="field-help">
              Output: {compressedType ?? "unknown"}{outputDimensions ? ` • ${outputDimensions}` : ""}
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
