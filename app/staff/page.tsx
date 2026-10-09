import type { Metadata } from "next";
import Link from "next/link";
import { Badge, StatusBadge } from "@/components/Badge";
import { IconAlert, IconArrow } from "@/components/Icons";
import { computeAlerts } from "@/lib/fraud";
import { addDays, fmtDateTime, fullName, isoDate } from "@/lib/format";
import { snapshot } from "@/lib/registry";
import { FLOW, isOpen, statusLabel } from "@/lib/rules";
import type { VerifyEvent } from "@/lib/types";

export const metadata: Metadata = { title: "Registry dashboard" };

const OUT: Record<VerifyEvent["outcome"], [string, "ok" | "bad" | "warn" | "mute"]> = {
  valid: ["Passed", "ok"], forged: ["Forged", "bad"], superseded: ["Old QR", "warn"], lost: ["Lost card", "bad"], underage: ["Under 18", "warn"], unknown: ["Unknown", "mute"], malformed: ["Unreadable", "mute"],
};

export default async function Dashboard() {
  const { residents, apps, events } = await snapshot();
  const alerts = computeAlerts(residents, apps, events);
  const name = (uin: string | null) => { const r = residents.find((x) => x.uin === uin); return r ? fullName(r) : uin ?? "Unknown"; };
  const weekAgo = addDays(new Date(), -7).toISOString();
  const week = events.filter((e) => e.at >= weekAgo && e.channel === "public");
  const flaggedWeek = week.filter((e) => e.outcome !== "valid").length;
  const open = apps.filter((a) => isOpen(a.status));

  // 14-day check volume
  const days = Array.from({ length: 14 }, (_, i) => isoDate(addDays(new Date(), i - 13)));
  const series = days.map((d) => {
    const es = events.filter((e) => e.channel === "public" && isoDate(new Date(e.at)) === d);
    return { d, ok: es.filter((e) => e.outcome === "valid").length, bad: es.filter((e) => e.outcome !== "valid").length };
  });
  const maxY = Math.max(4, ...series.map((s) => s.ok + s.bad));

  const tiles = [
    { k: "People in registry", v: residents.length, sub: `${residents.filter((r) => r.qrVersion > 1).length} with reissued QR` },
    { k: "Active ID cards", v: residents.filter((r) => r.idStatus === "Active").length, sub: `${residents.filter((r) => r.idStatus === "Reported lost").length} reported lost` },
    { k: "Open applications", v: open.length, sub: `${open.filter((a) => a.identity.mode === "home").length} done from home` },
    { k: "Checks this week", v: week.length, sub: `${flaggedWeek} flagged`, red: flaggedWeek > 0 },
    { k: "Fraud alerts", v: alerts.length, sub: `${alerts.filter((a) => a.severity === "high").length} high priority`, red: alerts.length > 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="eyebrow">Usajili · Registry</p><h1 className="text-3xl font-extrabold">Dashboard</h1></div>
        <p className="text-sm text-muted">Updated {fmtDateTime(new Date())}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {tiles.map((t) => (
          <div key={t.k} className={`rounded-2xl border bg-white p-4 ${t.red ? "border-ke-red/30" : "border-line"}`}>
            <p className="text-xs font-semibold text-muted">{t.k}</p>
            <p className={`mono mt-1 text-3xl font-semibold ${t.red ? "text-ke-red" : ""}`}>{t.v}</p>
            <p className="text-xs text-muted">{t.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        {/* alerts */}
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="flex items-center gap-2 text-lg font-bold"><IconAlert className="size-5 text-ke-red" /> Forgery and duplicate alerts</h2>
            <span className="mono text-sm text-muted">{alerts.length}</span>
          </div>
          {alerts.length === 0 ? <p className="p-6 text-sm text-muted">No alerts. Every recent check passed.</p> : (
            <ul className="divide-y divide-line">
              {alerts.map((a) => (
                <li key={a.id} className="grid grid-cols-[6px_1fr] gap-4 px-5 py-4">
                  <span className={`rounded-full ${a.severity === "high" ? "bg-ke-red" : "bg-amber"}`} />
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <b>{a.title}</b><span className="text-xs text-muted">{fmtDateTime(a.at)}</span>
                    </div>
                    <p className="text-sm text-muted">{a.detail}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {a.uins.map((u) => <Link key={u} href={`/staff/people/${u}`} className="rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold hover:border-ke-green">{name(u)}</Link>)}
                      {a.refs.map((r) => <Link key={r} href={`/staff/applications/${r}`} className="mono rounded-full bg-paper px-2.5 py-0.5 text-xs font-semibold hover:bg-ke-green-soft">{r}</Link>)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          {/* chart */}
          <section className="panel p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-bold">Verification checks, last 14 days</h2>
              <span className="flex gap-3 text-xs text-muted"><span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-ke-green" />Passed</span><span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-ke-red" />Flagged</span></span>
            </div>
            <svg viewBox="0 0 420 170" className="mt-4 w-full" role="img" aria-label="Daily verification checks">
              {[0, 0.5, 1].map((f) => <g key={f}><line x1="28" x2="416" y1={140 - f * 120} y2={140 - f * 120} stroke="var(--color-line)" /><text x="22" y={144 - f * 120} fontSize="10" textAnchor="end" fill="var(--color-muted)">{Math.round(maxY * f)}</text></g>)}
              {series.map((s, i) => {
                const x = 34 + i * 27.5, hOk = (s.ok / maxY) * 120, hBad = (s.bad / maxY) * 120;
                return (
                  <g key={s.d}>
                    <rect x={x} y={140 - hOk} width="18" height={hOk} rx="2" fill="var(--color-ke-green)" />
                    <rect x={x} y={140 - hOk - hBad} width="18" height={hBad} rx="2" fill="var(--color-ke-red)" />
                    {i % 2 === 1 && <text x={x + 9} y="158" fontSize="9" textAnchor="middle" fill="var(--color-muted)">{new Date(s.d + "T00:00:00").getDate()}</text>}
                  </g>
                );
              })}
            </svg>
          </section>

          {/* pipeline */}
          <section className="panel p-5">
            <div className="flex items-baseline justify-between"><h2 className="text-lg font-bold">Application pipeline</h2><Link href="/staff/applications" className="flex items-center gap-1 text-sm font-semibold text-ke-green">Queue <IconArrow className="size-4" /></Link></div>
            <ul className="mt-4 space-y-2">
              {FLOW.map((s) => {
                const n = apps.filter((a) => a.status === s).length;
                return (
                  <li key={s} className="grid grid-cols-[150px_1fr_28px] items-center gap-3 text-sm">
                    <span className="text-muted">{statusLabel(s)}</span>
                    <span className="h-2.5 overflow-hidden rounded-full bg-paper"><span className="block h-full rounded-full bg-ke-black" style={{ width: `${apps.length ? (n / apps.length) * 100 : 0}%` }} /></span>
                    <span className="mono text-right font-semibold">{n}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <section className="panel overflow-hidden">
          <h2 className="border-b border-line px-5 py-4 text-lg font-bold">Latest checks</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-paper text-left text-xs uppercase tracking-wider text-muted"><tr><th className="px-5 py-2.5">When</th><th className="px-3 py-2.5">Person</th><th className="px-3 py-2.5">Checked by</th><th className="px-5 py-2.5 text-right">Result</th></tr></thead>
              <tbody className="divide-y divide-line">
                {events.filter((e) => e.channel !== "wallet").sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8).map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap px-5 py-2.5 text-muted">{fmtDateTime(e.at)}</td>
                    <td className="px-3 py-2.5">{e.uin ? <Link href={`/staff/people/${e.uin}`} className="font-semibold hover:text-ke-green">{name(e.uin)}</Link> : "Unknown"}</td>
                    <td className="px-3 py-2.5">{e.verifier}<span className="block text-xs text-muted">{e.purpose}</span></td>
                    <td className="px-5 py-2.5 text-right"><Badge tone={OUT[e.outcome][1]}>{OUT[e.outcome][0]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4"><h2 className="text-lg font-bold">Waiting for an officer</h2><Link href="/staff/applications" className="text-sm font-semibold text-ke-green">All</Link></div>
          <ul className="divide-y divide-line">
            {open.sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(0, 6).map((a) => (
              <li key={a.ref}><Link href={`/staff/applications/${a.ref}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-paper">
                <span><b className="block">{name(a.uin)}</b><span className="mono text-xs text-muted">{a.ref} · {a.identity.mode === "home" ? "Home check" : "Office"} · {a.delivery.method === "courier" ? "Courier" : "Collect"}</span></span>
                <StatusBadge status={a.status} app={a} />
              </Link></li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
