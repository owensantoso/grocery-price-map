/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState } from "react";
import { MAX_PHOTO_WIDTH, PHOTO_QUALITY } from "@/lib/photos";

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

export function LogPhotoInput({ existingPhotoUrl }: LogPhotoInputProps) {
  const [previewUrl, setPreviewUrl] = useState(existingPhotoUrl ?? "");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

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
              const compressed = await compressImage(file);
              setPhotoDataUrl(compressed);
              setPreviewUrl(compressed);
              setStatusMessage("Compressed to a smaller WebP image for upload.");
            } catch {
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
      {statusMessage ? <p className="field-help">{statusMessage}</p> : null}
      {previewUrl ? (
        <div className="log-photo-preview">
          <img alt="Selected log photo preview" className="log-photo__image" src={previewUrl} />
        </div>
      ) : null}
    </div>
  );
}
