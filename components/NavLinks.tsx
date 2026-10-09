"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/apply", label: "Apply" },
  { href: "/track", label: "Track" },
  { href: "/verify", label: "Verify an ID" },
  { href: "/me", label: "My ID" },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-wrap items-center gap-1">
      {LINKS.map((l) => {
        const on = path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} aria-current={on ? "page" : undefined}
            className={`relative rounded-md px-3 py-2 text-sm font-semibold transition ${on ? "text-white" : "text-white/70 hover:text-white"}`}>
            {l.label}
            {on && <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded bg-ke-red" />}
          </Link>
        );
      })}
      <Link href="/staff" className={`ml-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${path.startsWith("/staff") || path.startsWith("/signin") ? "border-ke-green-bright bg-ke-green text-white" : "border-white/25 text-white hover:border-white/60"}`}>
        Staff portal
      </Link>
    </nav>
  );
}
