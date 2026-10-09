import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/Badge";
import { IdCardPair } from "@/components/IdCard";
import { Photo } from "@/components/Photo";
import { Timeline } from "@/components/Timeline";
import { AppActions } from "@/components/staff/Buttons";
import { readToken } from "@/lib/crypto";
import { computeAlerts } from "@/lib/fraud";
import { ageOn, fmtDate, fmtLongDay, fmtUIN, fullName, kes, turns18 } from "@/lib/format";
import { qrSvg, snapshot } from "@/lib/registry";
import { centreName, isOpen, nextAction } from "@/lib/rules";

type Check = { state: "ok" | "no" | "wait"; label: string; detail: string };

export default async function AppDetail({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const { residents, apps, events } = await snapshot();
  const a = apps.find((x) => x.ref === ref);
  if (!a) notFound();
  const r = residents.find((x) => x.uin === a.uin)!;
  const alerts = computeAlerts(residents, apps, events).filter((x) => x.uins.includes(a.uin) || x.refs.includes(a.ref));
  const sig = readToken(r.token);

  const checks: Check[] = [
    sig.ok ? { state: "ok", label: "Identity QR signature", detail: "Registry key" } : { state: "no", label: "Identity QR signature", detail: sig.reason },
    ageOn(r.dob) >= 18 ? { state: "ok", label: "Applicant is 18 or older", detail: `${ageOn(r.dob)} years` } : { state: "no", label: "Applicant is under 18", detail: `Eligible ${fmtDate(turns18(r.dob))}` },
    a.photo ? { state: "ok", label: "Passport photo", detail: "350 × 450 px" } : { state: "no", label: "Passport photo", detail: "Missing" },
    ...(a.type === "replacement" ? [a.docs.loss ? { state: "ok", label: "Police abstract", detail: a.docs.loss.name } as Check : { state: "no", label: "Police abstract", detail: "Missing" } as Check] : []),
    { state: "ok", label: "Fee paid", detail: `${kes(a.payment.amount)} · ${a.payment.receipt}` },
    apps.some((x) => x.uin === a.uin && x.ref !== a.ref && isOpen(x.status)) ? { state: "no", label: "Only open application", detail: "Another one is open" } : { state: "ok", label: "Only open application", detail: "" },
    alerts.length ? { state: "no", label: "Fraud screening", detail: `${alerts.length} alert${alerts.length > 1 ? "s" : ""} below` } : { state: "ok", label: "Fraud screening", detail: "No duplicate face, name or phone" },
    a.identity.mode === "home"
      ? (a.identity.match ?? 0) >= 0.6 ? { state: "ok", label: "Selfie matches photo", detail: `${Math.round((a.identity.match ?? 0) * 100)}% similarity` } : { state: "no", label: "Selfie matches photo", detail: `${Math.round((a.identity.match ?? 0) * 100)}% similarity` }
      : ["submitted", "review", "identity"].includes(a.status) ? { state: "wait", label: "Fingerprints and live photo", detail: `${centreName(a.identity.centre)}, ${fmtLongDay(a.identity.date!)} ${a.identity.time}` } : { state: "ok", label: "Fingerprints and live photo", detail: "Captured" },
  ];
  const blockers = checks.filter((c) => c.state === "no").length;
  const next = nextAction(a.status, a);
  const hardBlock = !sig.ok || ageOn(r.dob) < 18;

  const fig = (src: string | null, label: string, sub?: string) => (
    <figure className="space-y-1.5">
      <Photo src={src} alt={label} className="aspect-[35/45] w-full rounded-xl border border-line" label={label} />
      <figcaption className="text-xs"><b>{label}</b>{sub && <span className="block text-muted">{sub}</span>}</figcaption>
    </figure>
  );

  return (
    <div className="space-y-6">
      <Link href="/staff/applications" className="text-sm font-semibold text-ke-green">← Queue</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mono text-sm text-muted">{a.ref} · {a.type === "replacement" ? `Replacement of ${r.idNo}` : "First ID card"}{a.example ? " · example" : ""}</p>
          <h1 className="text-3xl font-extrabold"><Link href={`/staff/people/${r.uin}`} className="hover:text-ke-green">{fullName(r)}</Link></h1>
        </div>
        <StatusBadge status={a.status} app={a} />
      </div>

      {alerts.map((x) => (
        <div key={x.id} className={`rounded-xl border-l-4 p-4 ${x.severity === "high" ? "border-ke-red bg-ke-red-soft" : "border-amber bg-amber-soft"}`}><b className="block">{x.title}</b><p className="text-sm">{x.detail}</p></div>
      ))}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div className="space-y-6">
          <section className="panel overflow-hidden">
            <h2 className="border-b border-line px-5 py-3 font-bold">Automatic checks</h2>
            <ul className="divide-y divide-line">
              {checks.map((c) => (
                <li key={c.label} className="grid grid-cols-[22px_1fr_auto] items-center gap-3 px-5 py-2.5 text-sm">
                  <span className={`mono grid size-5 place-items-center rounded-full text-[0.7rem] font-bold text-white ${c.state === "ok" ? "bg-ke-green" : c.state === "no" ? "bg-ke-red" : "bg-amber"}`}>{c.state === "ok" ? "✓" : c.state === "no" ? "!" : "…"}</span>
                  <span>{c.label}</span><span className="text-right text-xs text-muted">{c.detail}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel p-5">
            <h2 className="mb-4 font-bold">Face comparison</h2>
            <div className="grid grid-cols-3 gap-3">
              {fig(a.photo, "Uploaded photo")}
              {a.identity.mode === "home" ? fig(a.identity.selfie, "Live selfie", a.identity.match != null ? `${Math.round(a.identity.match * 100)}% similarity` : undefined) : fig(null, "Live photo", "Taken at the office")}
              {fig(r.photo && r.photo !== a.photo ? r.photo : null, "Previous card photo", r.photo && r.photo !== a.photo ? "From last card" : "None on file")}
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="mb-3 font-bold">Documents</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between gap-3 rounded-lg bg-ke-green-soft px-3 py-2"><span>Birth certificate, parents&apos; IDs, chief&apos;s letter</span><b className="text-ke-green">Covered by QR</b></li>
              {Object.entries(a.docs).map(([k, d]) => d && (
                <li key={k} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
                  <span className="flex items-center gap-3">{d.thumb ? <img src={d.thumb} alt="" className="h-10 w-10 rounded object-cover" /> : <span className="mono grid h-10 w-10 place-items-center rounded bg-paper text-[0.6rem]">PDF</span>}<span><b className="block">{k === "loss" ? "Police abstract" : "Proof of address"}</b><span className="mono text-xs text-muted">{d.name}</span></span></span>
                  <span className="text-xs text-muted">{(d.size / 1024).toFixed(0)} KB</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          {isOpen(a.status) && (
            <section className="panel space-y-3 p-5">
              <h2 className="font-bold">Decision</h2>
              {hardBlock && <p className="rounded-lg bg-ke-red-soft p-3 text-sm text-ke-red">This application can&apos;t move forward: the QR or age check failed.</p>}
              <AppActions refNo={a.ref} next={next} canAdvance={!hardBlock} canReject={a.status !== "ready"} blockers={blockers} />
            </section>
          )}
          <section className="panel p-5">
            <h2 className="mb-3 font-bold">Registry record</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[["Identity number", fmtUIN(r.uin)], ["Born", `${fmtDate(r.dob)}, ${r.county}`], ["Mother", r.mother], ["Father", r.father ?? "Not recorded"], ["Phone", a.phone], ["Card to", a.delivery.method === "courier" ? `${a.delivery.address}, ${a.delivery.county}` : centreName(a.delivery.centre)]].map(([k, v]) => (
                <div key={k}><dt className="text-xs uppercase tracking-wider text-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>
              ))}
            </dl>
          </section>
          <section className="panel p-5"><h2 className="mb-4 font-bold">History</h2><Timeline app={a} staff /></section>
          {a.card && <section className="space-y-3"><h2 className="font-bold">Card</h2><IdCardPair r={r} card={a.card} photo={a.photo} qrSvg={await qrSvg(r.token)} /></section>}
        </div>
      </div>
    </div>
  );
}
