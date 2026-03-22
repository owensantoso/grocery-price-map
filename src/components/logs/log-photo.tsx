/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type LogPhotoProps = {
  alt: string;
  className?: string;
  src: string;
};

export function LogPhoto({ alt, className, src }: LogPhotoProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <button
        className={`log-photo ${className ?? ""}`.trim()}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <img alt={alt} className="log-photo__image" src={src} />
      </button>
      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <button
              aria-label="Close expanded photo"
              className="lightbox"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <img alt={alt} className="lightbox__image" src={src} />
            </button>,
            document.body,
          )
        : null}
    </>
  );
}
