"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { registrarReissue, resetDemo, staffAdvance, staffReject } from "@/app/actions";
import { REJECT_REASONS } from "@/lib/rules";

export function AppActions({ refNo, next, canAdvance, canReject, blockers }: { refNo: string; next: string | null; canAdvance: boolean; canReject: boolean; blockers: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [err, setErr] = useState("");
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => start(async () => { setErr(""); const r = await fn(); if (!r.ok) setErr(r.error ?? "Failed"); else { setRejecting(false); router.refresh(); } });

  return (
    <div className="space-y-3">
      {blockers > 0 && canAdvance && <p className="rounded-lg bg-amber-soft p-3 text-sm text-amber">{blockers} check{blockers > 1 ? "s" : ""} need attention. Approving overrides them and is recorded against your staff number.</p>}
      <div className="flex flex-wrap justify-between gap-2">
        {canReject ? <button className="btn-red" onClick={() => setRejecting((v) => !v)}>Reject…</button> : <span />}
        {next && <button className="btn-green" disabled={!canAdvance || pending} onClick={() => run(() => staffAdvance(refNo))}>{pending ? "Saving…" : next}</button>}
      </div>
      {rejecting && (
        <div className="space-y-3 rounded-xl border border-line p-4">
          <label className="field" htmlFor="reason">Reason the applicant will see
            <select id="reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)}>{REJECT_REASONS.map((r) => <option key={r}>{r}</option>)}</select>
          </label>
          <div className="flex gap-2"><button className="btn border-ke-red bg-ke-red text-white hover:bg-ke-red" disabled={pending} onClick={() => run(() => staffReject(refNo, reason))}>Reject application</button><button className="btn" onClick={() => setRejecting(false)}>Cancel</button></div>
        </div>
      )}
      {err && <p className="text-sm text-ke-red">{err}</p>}
    </div>
  );
}

export function ReissueButton({ uin }: { uin: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  if (!confirm) return <button className="btn-red btn-sm" onClick={() => setConfirm(true)}>Reissue QR</button>;
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-sm">
      Old QR stops working.
      <button className="btn btn-sm border-ke-red bg-ke-red text-white" disabled={pending} onClick={() => start(async () => { await registrarReissue(uin); setConfirm(false); router.refresh(); })}>Confirm</button>
      <button className="btn btn-sm" onClick={() => setConfirm(false)}>Cancel</button>
    </span>
  );
}

export function ResetButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  return confirm ? (
    <span className="inline-flex items-center gap-2 text-xs">Wipe and reload example data?
      <button className="rounded bg-ke-red px-2 py-1 font-semibold text-white" disabled={pending} onClick={() => start(async () => { await resetDemo(); setConfirm(false); router.refresh(); })}>Reset</button>
      <button className="underline" onClick={() => setConfirm(false)}>Cancel</button>
    </span>
  ) : <button className="text-xs underline underline-offset-2 opacity-70 hover:opacity-100" onClick={() => setConfirm(true)}>Reset example data</button>;
}
