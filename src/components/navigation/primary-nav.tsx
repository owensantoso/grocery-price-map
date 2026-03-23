"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS: Array<{
  href: string;
  icon?: string;
  label: string;
}> = [
  { href: "/", label: "Compare" },
  { href: "/logs", label: "Logs" },
  { href: "/items", label: "Items" },
  { href: "/stores", label: "Stores" },
  { href: "/prices/new", icon: "+", label: "Add Price" },
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
            className={`main-nav__link ${item.href === "/prices/new" ? "main-nav__link--accent" : ""} ${isActive ? "is-active" : ""}`}
            href={item.href}
            prefetch
          >
            {item.icon ? <span className="main-nav__icon">{item.icon}</span> : null}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
