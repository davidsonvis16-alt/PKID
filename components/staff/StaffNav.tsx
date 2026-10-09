"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBaby, IconGrid, IconInbox, IconUsers } from "../Icons";

export function StaffNav({ counts }: { counts: { alerts: number; queue: number } }) {
  const path = usePathname();
  const items = [
    { href: "/staff", label: "Dashboard", icon: IconGrid, badge: counts.alerts, red: true, exact: true },
    { href: "/staff/people", label: "People", icon: IconUsers },
    { href: "/staff/applications", label: "Applications", icon: IconInbox, badge: counts.queue },
    { href: "/staff/registrar", label: "Birth registration", icon: IconBaby },
  ];
  return (
    <nav className="flex gap-1 overflow-x-auto lg:grid">
      {items.map((it) => {
        const on = it.exact ? path === it.href : path.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${on ? "bg-white text-ink shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
            <it.icon className="size-5" />
            <span className="flex-1">{it.label}</span>
            {!!it.badge && <span className={`mono rounded-full px-2 text-xs ${it.red ? "bg-ke-red text-white" : on ? "bg-paper" : "bg-white/15"}`}>{it.badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
