/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

type LogPhotoProps = {
  alt: string;
  className?: string;
  src: string;
};

export function LogPhoto({ alt, className, src }: LogPhotoProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className={`log-photo ${className ?? ""}`.trim()}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <img alt={alt} className="log-photo__image" src={src} />
      </button>
      {isOpen ? (
        <button
          aria-label="Close expanded photo"
          className="lightbox"
          onClick={() => setIsOpen(false)}
          type="button"
        >
          <img alt={alt} className="lightbox__image" src={src} />
        </button>
      ) : null}
    </>
  );
}
