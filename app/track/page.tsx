import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/Badge";
import { snapshot } from "@/lib/registry";
import { fullName } from "@/lib/format";

export const metadata: Metadata = { title: "Track an application" };
export const dynamic = "force-dynamic";

export default async function Track({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const { apps, residents } = await snapshot();
  if (ref) {
    const hit = apps.find((a) => a.ref.toLowerCase() === ref.trim().toLowerCase());
    if (hit) redirect(`/track/${hit.ref}`);
  }
  const examples = apps.filter((a) => a.example);
  return (
    <div className="bg-paper">
      <div className="wrap max-w-3xl py-14">
        <p className="eyebrow">Fuatilia · Track</p>
        <h1 className="mt-1 text-4xl font-extrabold sm:text-5xl">Track an application</h1>
        <p className="mt-2 text-muted">Enter the reference from your SMS. It looks like TMB-2026-481207.</p>
        <form className="mt-8 flex flex-wrap gap-2" action="/track">
          <label htmlFor="ref" className="sr-only">Reference number</label>
          <input id="ref" name="ref" defaultValue={ref} className="input mono max-w-sm flex-1 text-lg uppercase" placeholder="TMB-2026-000000" />
          <button className="btn-green px-6">Find</button>
        </form>
        {ref && <div className="mt-4 rounded-xl border-l-4 border-ke-red bg-ke-red-soft p-4 text-sm"><b className="block">No application with reference {ref}</b>Check the SMS we sent when you applied. References start with TMB-2026.</div>}
        <div className="mt-10">
          <p className="eyebrow mb-3">Example applications</p>
          <div className="panel divide-y divide-line">
            {examples.map((a) => {
              const r = residents.find((x) => x.uin === a.uin)!;
              return (
                <Link key={a.ref} href={`/track/${a.ref}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-paper">
                  <span><b className="block">{fullName(r)}</b><span className="mono text-sm text-muted">{a.ref}</span></span>
                  <StatusBadge status={a.status} app={a} />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
