"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS: Array<{
  href: string;
  label: string;
}> = [
  { href: "/", label: "Compare" },
  { href: "/logs", label: "Logs" },
  { href: "/items", label: "Items" },
  { href: "/stores", label: "Stores" },
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
            className={`main-nav__link ${isActive ? "is-active" : ""}`}
            href={item.href}
          >
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
