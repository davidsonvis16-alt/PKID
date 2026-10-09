import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, IdStatusBadge, StatusBadge } from "@/components/Badge";
import { IdCardPair } from "@/components/IdCard";
import { Photo } from "@/components/Photo";
import { ReissueButton } from "@/components/staff/Buttons";
import { computeAlerts, hamming, nameSimilarity } from "@/lib/fraud";
import { ageOn, fmtDate, fmtDateTime, fmtUIN, fullName } from "@/lib/format";
import { qrSvg, snapshot } from "@/lib/registry";

export default async function Person({ params }: { params: Promise<{ uin: string }> }) {
  const { uin } = await params;
  const { residents, apps, events } = await snapshot();
  const r = residents.find((x) => x.uin === uin);
  if (!r) notFound();
  const alerts = computeAlerts(residents, apps, events).filter((a) => a.uins.includes(uin));
  const myApps = apps.filter((a) => a.uin === uin).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const checks = events.filter((e) => e.uin === uin).sort((a, b) => b.at.localeCompare(a.at));
  const withCard = myApps.find((a) => a.card);
  const qr = await qrSvg(r.token);

  // Lookalikes: anyone whose name, birth date or face is close to this person
  const look = residents.filter((o) => o.uin !== uin).map((o) => {
    const name = nameSimilarity(fullName(r), fullName(o));
    const face = r.photoHash && o.photoHash ? 1 - hamming(r.photoHash, o.photoHash) / 64 : null;
    const score = Math.max(name * (o.dob === r.dob ? 1 : 0.6), face ?? 0);
    return { o, name, face, sameDob: o.dob === r.dob, score };
  }).filter((x) => x.score >= 0.45).sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div className="space-y-6">
      <Link href="/staff/people" className="text-sm font-semibold text-ke-green">← All people</Link>
      <section className="panel overflow-hidden">
        <div className="ribbon h-1.5" />
        <div className="grid gap-6 p-6 md:grid-cols-[130px_1fr_200px]">
          <Photo src={r.photo} alt={`Photo of ${fullName(r)}`} className="aspect-[35/45] w-full rounded-xl" label="No photo yet" />
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-extrabold">{fullName(r)}</h1><IdStatusBadge status={r.idStatus} />{alerts.length > 0 && <Badge tone="bad">{alerts.length} alert{alerts.length > 1 ? "s" : ""}</Badge>}</div>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              {[
                ["Identity number", fmtUIN(r.uin), true], ["ID card number", r.idNo ?? "None", true], ["Date of birth", `${fmtDate(r.dob)} · ${ageOn(r.dob)} yrs`],
                ["Sex", r.sex === "F" ? "Female" : "Male"], ["Place of birth", `${r.county} County`], ["Phone on record", r.phone ?? "None", true],
                ["Mother", r.mother], ["Father", r.father ?? "Not recorded"], ["Birth registered", fmtDate(r.registeredAt)],
              ].map(([k, v, m]) => <div key={k as string}><dt className="text-xs uppercase tracking-wider text-muted">{k}</dt><dd className={`font-semibold ${m ? "mono" : ""}`}>{v}</dd></div>)}
            </dl>
          </div>
          <div className="space-y-2">
            <div className="rounded-xl border border-line bg-white p-2" dangerouslySetInnerHTML={{ __html: qr }} />
            <p className="text-xs text-muted">QR v{r.qrVersion}, issued {fmtDate(r.qrIssuedAt)}</p>
            <ReissueButton uin={r.uin} />
          </div>
        </div>
      </section>

      {alerts.length > 0 && (
        <section className="space-y-2">
          {alerts.map((a) => (
            <div key={a.id} className={`rounded-xl border-l-4 p-4 ${a.severity === "high" ? "border-ke-red bg-ke-red-soft" : "border-amber bg-amber-soft"}`}>
              <b className="block">{a.title}</b><p className="text-sm">{a.detail}</p>
            </div>
          ))}
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="panel p-5">
          <h2 className="text-lg font-bold">Lookalikes</h2>
          <p className="text-sm text-muted">People close to this record by name, birth date or face. Use this before approving a first ID.</p>
          {look.length === 0 ? <p className="mt-4 text-sm text-muted">No close matches in the registry.</p> : (
            <ul className="mt-4 divide-y divide-line">
              {look.map(({ o, name, face, sameDob }) => (
                <li key={o.uin} className="flex items-center gap-3 py-3">
                  <Photo src={o.photo} alt="" className="h-12 w-[38px] shrink-0 rounded-md" label="—" />
                  <Link href={`/staff/people/${o.uin}`} className="min-w-0 flex-1"><b className="block hover:text-ke-green">{fullName(o)}</b><span className="mono text-xs text-muted">{fmtUIN(o.uin)} · {fmtDate(o.dob)}</span></Link>
                  <span className="flex flex-wrap justify-end gap-1 text-xs">
                    <Badge tone={name >= 0.6 ? "bad" : "mute"}>Name {Math.round(name * 100)}%</Badge>
                    {sameDob && <Badge tone="bad">Same birth date</Badge>}
                    {face !== null && <Badge tone={face >= 0.9 ? "bad" : "mute"}>Face {Math.round(face * 100)}%</Badge>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel p-5">
          <h2 className="text-lg font-bold">Applications</h2>
          {myApps.length === 0 ? <p className="mt-3 text-sm text-muted">No applications.</p> : (
            <ul className="mt-3 divide-y divide-line">{myApps.map((a) => (
              <li key={a.ref}><Link href={`/staff/applications/${a.ref}`} className="flex items-center justify-between gap-3 py-3 hover:text-ke-green"><span className="mono font-semibold">{a.ref}<span className="block font-sans text-xs font-normal text-muted">{fmtDateTime(a.createdAt)} · {a.type === "replacement" ? "Replacement" : "First ID"}</span></span><StatusBadge status={a.status} app={a} /></Link></li>
            ))}</ul>
          )}
        </section>
      </div>

      <section className="panel overflow-hidden">
        <h2 className="border-b border-line px-5 py-4 text-lg font-bold">Verification history <span className="text-sm font-normal text-muted">· the same log the person sees in My ID</span></h2>
        {checks.length === 0 ? <p className="p-5 text-sm text-muted">Never checked.</p> : (
          <ul className="divide-y divide-line">{checks.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
              <span><b>{e.verifier}</b> · {e.purpose}<span className="block text-xs text-muted">{fmtDateTime(e.at)} · {e.channel}</span></span>
              <Badge tone={e.outcome === "valid" ? "ok" : e.outcome === "forged" || e.outcome === "lost" ? "bad" : "warn"}>{e.outcome}</Badge>
            </li>
          ))}</ul>
        )}
      </section>

      {withCard?.card && <section className="space-y-3"><h2 className="text-lg font-bold">Card on file</h2><IdCardPair r={r} card={withCard.card} photo={withCard.photo} qrSvg={qr} row /></section>}
    </div>
  );
}
