import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/Badge";
import { computeAlerts } from "@/lib/fraud";
import { fmtDateTime, fullName, kes } from "@/lib/format";
import { snapshot } from "@/lib/registry";

export const metadata: Metadata = { title: "Applications" };

const TABS = { open: ["submitted", "review", "identity", "printing"], ready: ["ready"], closed: ["collected", "rejected"] } as const;

export default async function Applications({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: t } = await searchParams;
  const tab = (t && t in TABS ? t : "open") as keyof typeof TABS;
  const { residents, apps, events } = await snapshot();
  const alerts = computeAlerts(residents, apps, events);
  const list = apps.filter((a) => (TABS[tab] as readonly string[]).includes(a.status)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const name = (uin: string) => fullName(residents.find((r) => r.uin === uin)!);

  return (
    <div className="space-y-5">
      <div><p className="eyebrow">Maombi · Applications</p><h1 className="text-3xl font-extrabold">Application queue</h1><p className="text-sm text-muted">Oldest first. Rows with fraud alerts are marked red.</p></div>
      <div className="inline-flex rounded-xl border border-line bg-white p-1">
        {(Object.keys(TABS) as (keyof typeof TABS)[]).map((k) => (
          <Link key={k} href={`/staff/applications?tab=${k}`} className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize ${tab === k ? "bg-ke-black text-white" : "text-muted hover:text-ink"}`}>
            {k === "ready" ? "Delivery & collection" : k} <span className="mono opacity-60">{apps.filter((a) => (TABS[k] as readonly string[]).includes(a.status)).length}</span>
          </Link>
        ))}
      </div>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-paper text-left text-xs uppercase tracking-wider text-muted"><tr><th className="px-4 py-3">Applicant</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Identity check</th><th className="px-3 py-3">Card to</th><th className="px-3 py-3">Paid</th><th className="px-4 py-3 text-right">Status</th></tr></thead>
          <tbody className="divide-y divide-line">
            {list.map((a) => {
              const flagged = alerts.some((x) => x.uins.includes(a.uin) || x.refs.includes(a.ref));
              return (
                <tr key={a.ref} className={flagged ? "bg-ke-red-soft/50" : ""}>
                  <td className="px-4 py-3"><Link href={`/staff/applications/${a.ref}`} className="font-semibold hover:text-ke-green">{name(a.uin)}</Link><span className="mono block text-xs text-muted">{a.ref} · {fmtDateTime(a.createdAt)}{a.example ? " · example" : ""}</span>{flagged && <span className="text-xs font-semibold text-ke-red">Fraud alert on this person</span>}</td>
                  <td className="px-3 py-3">{a.type === "replacement" ? "Replacement" : "First ID"}</td>
                  <td className="px-3 py-3">{a.identity.mode === "home" ? `Selfie${a.identity.match != null ? ` · ${Math.round(a.identity.match * 100)}%` : ""}` : "Office visit"}</td>
                  <td className="px-3 py-3">{a.delivery.method === "courier" ? `Courier · ${a.delivery.county}` : "Collect"}</td>
                  <td className="mono px-3 py-3">{kes(a.payment.amount)}</td>
                  <td className="px-4 py-3 text-right"><StatusBadge status={a.status} app={a} /></td>
                </tr>
              );
            })}
            {list.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Nothing here right now.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
