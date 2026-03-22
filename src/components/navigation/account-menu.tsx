"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOutAction } from "@/app/actions";

type AccountMenuProps = {
  configured: boolean;
  viewerEmail?: string | null;
};

export function AccountMenu({ configured, viewerEmail }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (!configured) {
    return (
      <Link className="button button-primary header-signin" href="/auth/sign-in">
        Setup required
      </Link>
    );
  }

  if (!viewerEmail) {
    return (
      <Link className="button button-primary header-signin" href="/auth/sign-in">
        Sign in
      </Link>
    );
  }

  return (
    <div className="account-menu" ref={rootRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={`account-menu__trigger ${isOpen ? "is-open" : ""}`}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="account-menu__icon" aria-hidden="true">
          ☰
        </span>
        <span className="account-menu__label">Menu</span>
      </button>
      {isOpen ? (
        <div className="account-menu__panel" role="menu">
          <Link
            className="account-menu__link"
            href="/account"
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            <span className="account-menu__meta">Signed in as</span>
            <strong>{viewerEmail}</strong>
          </Link>
          <form action={signOutAction}>
            <button className="account-menu__signout" role="menuitem" type="submit">
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
