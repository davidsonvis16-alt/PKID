"use client";
import { useState } from "react";
import { walletOpen, walletReportLost } from "@/app/actions";
import { fmtDate, fmtDateTime, fmtUIN } from "@/lib/format";
import { IdStatusBadge } from "./Badge";
import { IconAlert, IconLock } from "./Icons";
import { QrInput, type Sample } from "./QrInput";

type W = Extract<Awaited<ReturnType<typeof walletOpen>>, { ok: true }>;
const OUTCOME: Record<string, [string, string]> = {
  valid: ["Passed", "bg-ke-green-soft text-ke-green"], forged: ["Forged copy", "bg-ke-red-soft text-ke-red"], superseded: ["Old QR", "bg-amber-soft text-amber"],
  lost: ["Lost card used", "bg-ke-red-soft text-ke-red"], underage: ["Too young", "bg-amber-soft text-amber"], unknown: ["Unknown", "bg-paper text-muted"], malformed: ["Unreadable", "bg-paper text-muted"],
};

export function WalletPanel({ samples }: { samples: (Sample & { dob: string })[] }) {
  const [token, setToken] = useState("");
  const [dob, setDob] = useState("");
  const [w, setW] = useState<W | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmLost, setConfirmLost] = useState(false);

  async function open(t = token, d = dob) {
    if (!t) { setErr("Scan or upload your QR first."); return; }
    if (!d) { setErr("Enter your date of birth."); return; }
    setBusy(true); setErr("");
    const res = await walletOpen(t, d);
    setBusy(false);
    if (res.ok) setW(res); else setErr(res.error);
  }

  if (!w) {
    return (
      <div className="panel mx-auto max-w-3xl space-y-6 p-6 sm:p-8">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-ke-black text-white"><IconLock className="size-5" /></span><p className="text-sm text-muted">Two checks: your QR, plus your date of birth, which isn&apos;t printed in the QR.</p></div>
        <QrInput onToken={(t) => { setToken(t); setErr(""); }} samples={samples.map((s) => ({ ...s, note: `Date of birth ${s.dob}` }))} />
        {token && <p className="text-sm font-semibold text-ke-green">QR loaded. Now confirm your date of birth.</p>}
        <div className="flex flex-wrap items-end gap-3">
          <label className="field" htmlFor="dob">Date of birth<input id="dob" type="date" className="input" value={dob} onChange={(e) => setDob(e.target.value)} /></label>
          <button className="btn-green" disabled={busy} onClick={() => open()}>{busy ? "Opening…" : "Open My ID"}</button>
          {token && samples.find((s) => s.token === token) && !dob && <button className="btn btn-sm" onClick={() => { const d = samples.find((s) => s.token === token)!.dob; setDob(d); open(token, d); }}>Fill example birth date</button>}
        </div>
        {err && <div className="rounded-xl border-l-4 border-ke-red bg-ke-red-soft p-4 text-sm">{err}</div>}
      </div>
    );
  }

  const r = w.resident;
  const flagged = w.checks.filter((c) => c.outcome !== "valid").length;
  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div className="space-y-4">
        <div className="overflow-hidden rounded-2xl bg-ke-black text-white">
          <div className="ribbon h-1.5" />
          <div className="space-y-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-xs uppercase tracking-widest text-white/50">Identity QR · v{r.qrVersion}</p><b className="font-display text-2xl">{r.given} {r.surname}</b><p className="mono text-sm text-white/70">{fmtUIN(r.uin)}</p></div>
              <IdStatusBadge status={r.idStatus} />
            </div>
            <div className="rounded-xl bg-white p-3" dangerouslySetInnerHTML={{ __html: w.qr }} />
            <p className="text-xs text-white/55">Issued {fmtDate(r.qrIssuedAt)}. Show this at a bank, SACCO or employer instead of handing over your ID.</p>
          </div>
        </div>
        {r.idNo && r.idStatus !== "Reported lost" && (
          confirmLost ? (
            <div className="space-y-3 rounded-2xl border border-ke-red/30 bg-ke-red-soft p-5">
              <b className="block">Block card {r.idNo}?</b>
              <p className="text-sm">Anyone who presents it afterwards gets flagged. You&apos;ll need to apply for a replacement.</p>
              <div className="flex gap-2">
                <button className="btn border-ke-red bg-ke-red text-white hover:bg-ke-red" onClick={async () => { const res = await walletReportLost(token, dob); if (res.ok) { setConfirmLost(false); open(); } else setErr(res.error); }}>Yes, report it lost</button>
                <button className="btn" onClick={() => setConfirmLost(false)}>Cancel</button>
              </div>
            </div>
          ) : <button className="btn-red w-full" onClick={() => setConfirmLost(true)}><IconAlert className="size-4" /> Report my card lost or stolen</button>
        )}
        <button className="btn w-full" onClick={() => { setW(null); setToken(""); setDob(""); }}>Close My ID</button>
      </div>

      <div className="space-y-6">
        <div className="panel p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-bold">Who checked my ID</h2>
            <span className={`text-sm font-semibold ${flagged ? "text-ke-red" : "text-muted"}`}>{w.checks.length} checks · {flagged} flagged</span>
          </div>
          {w.checks.length === 0 ? <p className="mt-4 text-sm text-muted">Nobody has scanned your QR yet.</p> : (
            <ul className="mt-4 divide-y divide-line">
              {w.checks.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span><b className="block">{c.verifier}</b><span className="text-sm text-muted">{c.purpose} · {fmtDateTime(c.at)}</span></span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${OUTCOME[c.outcome][1]}`}>{OUTCOME[c.outcome][0]}</span>
                </li>
              ))}
            </ul>
          )}
          {flagged > 0 && <p className="mt-4 rounded-xl bg-ke-red-soft p-3 text-sm">Something here wasn&apos;t you? Report your card lost, and a registrar can reissue your QR so old copies stop working.</p>}
        </div>
        <div className="panel p-6">
          <h2 className="text-xl font-bold">My applications</h2>
          {w.apps.length === 0 ? <p className="mt-3 text-sm text-muted">None yet.</p> : (
            <ul className="mt-3 divide-y divide-line">{w.apps.map((a) => <li key={a.ref} className="flex justify-between gap-3 py-3"><a className="mono font-semibold text-ke-green" href={`/track/${a.ref}`}>{a.ref}</a><span className="text-sm">{a.label}</span></li>)}</ul>
          )}
        </div>
        <div className="panel grid gap-4 p-6 sm:grid-cols-3">
          {[["Place of birth", `${r.county} County`], ["Mother", r.mother], ["Father", r.father ?? "Not recorded"]].map(([k, v]) => <div key={k}><p className="text-xs uppercase tracking-wider text-muted">{k}</p><p className="font-semibold">{v}</p></div>)}
          <p className="text-xs text-muted sm:col-span-3">Only you and registry staff see these. Verifiers see your name, age bracket and ID status.</p>
        </div>
      </div>
    </div>
  );
}
