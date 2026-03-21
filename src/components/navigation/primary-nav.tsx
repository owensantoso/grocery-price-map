"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  primary?: boolean;
}> = [
  { href: "/", label: "Compare" },
  { href: "/prices/new", label: "Add Price", primary: true },
  { href: "/stores", label: "Stores" },
  { href: "/items", label: "Items" },
];

export function PrimaryNav() {
  const pathname = usePathname();

  return (
    <nav className="main-nav" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            className={`main-nav__link ${item.primary ? "main-nav__link--primary" : ""} ${
              isActive ? "is-active" : ""
            }`}
            href={item.href}
          >
            {item.primary ? <span className="main-nav__icon">+</span> : null}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
