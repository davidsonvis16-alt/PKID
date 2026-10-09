"use client";
import { useState } from "react";
import { verifyPublic } from "@/app/actions";
import { fmtDateTime, fmtUIN } from "@/lib/format";
import { IdStatusBadge } from "./Badge";
import { IconAlert, IconCheck, IconX } from "./Icons";
import { Photo } from "./Photo";
import { QrInput, type Sample } from "./QrInput";

type Res = Awaited<ReturnType<typeof verifyPublic>>;

export function VerifyPanel({ samples }: { samples: Sample[] }) {
  const [verifier, setVerifier] = useState("");
  const [purpose, setPurpose] = useState("Account opening");
  const [res, setRes] = useState<Res | null>(null);
  const [busy, setBusy] = useState(false);

  async function check(t: string) {
    setBusy(true); setRes(null);
    setRes(await verifyPublic(t, verifier.trim(), purpose));
    setBusy(false);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <div className="panel space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field" htmlFor="org">Your organisation <small>Shown in the person&apos;s log</small><input id="org" className="input" value={verifier} onChange={(e) => setVerifier(e.target.value)} placeholder="e.g. Kilimo SACCO, Eldoret" /></label>
          <label className="field" htmlFor="purpose">Reason for the check
            <select id="purpose" className="input" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
              {["Account opening", "SIM registration", "Loan application", "Staff onboarding", "Admissions", "Guest check-in", "Property rental", "Other"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
        </div>
        <QrInput onToken={check} samples={samples} busy={busy} />
      </div>

      <div className="space-y-4">
        {!res && !busy && (
          <div className="grid h-full min-h-64 place-items-center rounded-2xl border-2 border-dashed border-line p-8 text-center text-muted">
            <p className="max-w-xs">Scan or upload a QR. You&apos;ll see whether it&apos;s genuine and the minimum you need, nothing more.</p>
          </div>
        )}
        {res && !res.ok && (
          <div className="overflow-hidden rounded-2xl border border-ke-red/30 bg-ke-red-soft">
            <div className="flex items-center gap-4 p-6">
              <span className="grid size-16 shrink-0 place-items-center rounded-full bg-ke-red text-white"><IconX className="size-8" /></span>
              <div><h2 className="text-2xl font-bold text-ke-red">{res.outcome === "superseded" ? "Old QR, no longer valid" : res.outcome === "malformed" ? "Not an identity QR" : "Do not accept this QR"}</h2><p className="mt-1 text-sm">{res.reason}</p></div>
            </div>
            {res.outcome === "forged" && <p className="border-t border-ke-red/20 bg-white/60 px-6 py-3 text-sm">The attempt was logged and the registry&apos;s fraud desk can see it. Ask for another form of identification.</p>}
          </div>
        )}
        {res && res.ok && (
          <>
            <div className={`flex items-center gap-4 rounded-2xl p-6 ${res.idStatus === "Reported lost" ? "bg-amber-soft" : "bg-ke-green-soft"}`}>
              <span className={`grid size-16 shrink-0 place-items-center rounded-full text-white ${res.idStatus === "Reported lost" ? "bg-amber" : "bg-ke-green"}`}>{res.idStatus === "Reported lost" ? <IconAlert className="size-8" /> : <IconCheck className="size-8" />}</span>
              <div>
                <h2 className={`text-2xl font-bold ${res.idStatus === "Reported lost" ? "text-amber" : "text-ke-green"}`}>{res.idStatus === "Reported lost" ? "Genuine QR, but the card is reported lost" : "Genuine. Issued by the registry"}</h2>
                <p className="mt-1 text-sm">{res.idStatus === "Reported lost" ? "The QR is real. Make sure the person in front of you matches the photo before you continue." : `Signature checked ${fmtDateTime(res.checkedAt)}.`}</p>
              </div>
            </div>
            <div className="panel grid grid-cols-[110px_1fr] gap-5 p-5">
              <Photo src={res.photo} alt={`Photo of ${res.name}`} className="aspect-[35/45] w-full rounded-lg" label="No card photo" />
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2"><b className="font-display text-xl">{res.name}</b><IdStatusBadge status={res.idStatus} /></div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-muted">Identity number</dt><dd className="mono font-semibold">{fmtUIN(res.uin)}</dd></div>
                  <div><dt className="text-muted">Over 18</dt><dd className="font-semibold">{res.over18 ? "Yes" : "No"}</dd></div>
                  <div><dt className="text-muted">Year of birth</dt><dd className="font-semibold">{res.birthYear}</dd></div>
                  <div><dt className="text-muted">ID number</dt><dd className="mono font-semibold">{res.idNo ?? "—"}</dd></div>
                </dl>
              </div>
            </div>
            <p className="text-sm text-muted">Parents&apos; names, exact birth date and place of birth stay with the registry. This check now appears in the person&apos;s own log, with your organisation&apos;s name.</p>
          </>
        )}
      </div>
    </div>
  );
}
