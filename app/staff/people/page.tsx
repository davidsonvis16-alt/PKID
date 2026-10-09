import type { Metadata } from "next";
import Link from "next/link";
import { IdStatusBadge } from "@/components/Badge";
import { Photo } from "@/components/Photo";
import { computeAlerts } from "@/lib/fraud";
import { ageOn, fmtDate, fmtUIN, fullName } from "@/lib/format";
import { snapshot } from "@/lib/registry";

export const metadata: Metadata = { title: "People" };

export default async function People({ searchParams }: { searchParams: Promise<{ q?: string; flagged?: string }> }) {
  const { q = "", flagged } = await searchParams;
  const { residents, apps, events } = await snapshot();
  const alerts = computeAlerts(residents, apps, events);
  const flags = (uin: string) => alerts.filter((a) => a.uins.includes(uin));
  const needle = q.trim().toLowerCase().replace(/\s+/g, " ");
  const digits = needle.replace(/\s/g, "");
  const list = residents
    .filter((r) => !needle || fullName(r).toLowerCase().includes(needle) || r.uin.includes(digits) || (r.idNo ?? "").includes(digits) || (r.phone ?? "").includes(digits) || r.mother.toLowerCase().includes(needle))
    .filter((r) => !flagged || flags(r.uin).length > 0)
    .sort((a, b) => flags(b.uin).length - flags(a.uin).length || a.surname.localeCompare(b.surname));

  return (
    <div className="space-y-5">
      <div><p className="eyebrow">Watu · People</p><h1 className="text-3xl font-extrabold">Everyone in the registry</h1><p className="text-sm text-muted">Search by name, identity number, ID number, phone or mother&apos;s name. Flagged people sort to the top.</p></div>
      <form className="flex flex-wrap gap-2">
        <label htmlFor="q" className="sr-only">Search</label>
        <input id="q" name="q" defaultValue={q} className="input max-w-md flex-1" placeholder="Kevin, 6651 0937, 0712345678…" />
        <label className="btn cursor-pointer"><input type="checkbox" name="flagged" value="1" defaultChecked={!!flagged} className="accent-ke-red" /> Flagged only</label>
        <button className="btn-black">Search</button>
      </form>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-paper text-left text-xs uppercase tracking-wider text-muted">
            <tr><th className="px-4 py-3">Person</th><th className="px-3 py-3">Identity number</th><th className="px-3 py-3">Born</th><th className="px-3 py-3">Place of birth</th><th className="px-3 py-3">ID card</th><th className="px-3 py-3">QR</th><th className="px-4 py-3">Flags</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((r) => {
              const f = flags(r.uin);
              return (
                <tr key={r.uin} className={f.length ? "bg-ke-red-soft/40" : ""}>
                  <td className="px-4 py-3">
                    <Link href={`/staff/people/${r.uin}`} className="flex items-center gap-3">
                      <Photo src={r.photo} alt="" className="h-12 w-[38px] shrink-0 rounded-md" label="—" />
                      <span><b className="block hover:text-ke-green">{fullName(r)}</b><span className="text-xs text-muted">{r.sex === "F" ? "Female" : "Male"} · Mother: {r.mother}</span></span>
                    </Link>
                  </td>
                  <td className="mono px-3 py-3">{fmtUIN(r.uin)}</td>
                  <td className="px-3 py-3">{fmtDate(r.dob)}<span className="block text-xs text-muted">{ageOn(r.dob)} years</span></td>
                  <td className="px-3 py-3">{r.county}</td>
                  <td className="px-3 py-3"><span className="mono block">{r.idNo ?? "—"}</span><IdStatusBadge status={r.idStatus} /></td>
                  <td className="mono px-3 py-3">v{r.qrVersion}</td>
                  <td className="px-4 py-3">{f.length ? <span className="flex flex-wrap gap-1">{f.map((a) => <span key={a.id} className={`rounded px-1.5 py-0.5 text-[0.7rem] font-semibold text-white ${a.severity === "high" ? "bg-ke-red" : "bg-amber"}`}>{a.title}</span>)}</span> : <span className="text-muted">None</span>}</td>
                </tr>
              );
            })}
            {list.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">Nobody matches &ldquo;{q}&rdquo;.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
