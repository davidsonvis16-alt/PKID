"use client";
import { useState } from "react";
import { decodeQr, readQrFile } from "@/lib/image-client";
import { Camera } from "./Camera";
import { IconCamera, IconQr, IconUpload } from "./Icons";

export type Sample = { uin: string; name: string; age: number; token: string; note?: string };

/** Four ways to present a QR: live camera, photo upload, pasted code, or an example person. */
export function QrInput({ onToken, samples, busy, error }: { onToken: (t: string) => void; samples?: Sample[]; busy?: boolean; error?: string }) {
  const [mode, setMode] = useState<"camera" | "upload" | "paste">("upload");
  const [text, setText] = useState("");
  const [localErr, setLocalErr] = useState("");
  const [over, setOver] = useState(false);

  const file = async (f?: File | null) => {
    if (!f) return;
    setLocalErr("");
    try { onToken(await readQrFile(f)); } catch (e) { setLocalErr((e as Error).message); }
  };
  const err = localErr || error;

  return (
    <div className="space-y-4">
      <div role="tablist" className="inline-flex rounded-xl border border-line bg-paper p-1">
        {([["upload", "Upload photo", IconUpload], ["camera", "Scan with camera", IconCamera], ["paste", "Paste code", IconQr]] as const).map(([k, l, I]) => (
          <button key={k} role="tab" aria-selected={mode === k} onClick={() => { setMode(k); setLocalErr(""); }}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === k ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}>
            <I className="size-4" /> <span className="hidden sm:inline">{l}</span><span className="sm:hidden">{l.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {mode === "upload" && (
        <label
          onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); file(e.dataTransfer.files[0]); }}
          className={`grid cursor-pointer place-items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition ${over ? "border-ke-green bg-ke-green-soft" : "border-line bg-paper hover:border-ke-green"}`}>
          <span className="grid size-12 place-items-center rounded-full bg-ke-green text-white"><IconQr className="size-6" /></span>
          <b>Upload a photo of your QR</b>
          <span className="text-sm text-muted">JPG or PNG. A screenshot works too. You can also drag it here.</span>
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => file(e.target.files?.[0])} />
        </label>
      )}

      {mode === "camera" && (
        <Camera facing="environment" className="aspect-video max-h-80 w-full"
          onFrame={(v) => { const t = decodeQr(v); if (t) { onToken(t); setMode("upload"); return true; } }}
          overlay={<div className="pointer-events-none absolute inset-0 grid place-items-center"><div className="size-48 rounded-2xl border-4 border-white/80 shadow-[0_0_0_9999px_rgb(0_0_0/0.35)]" /></div>} />
      )}

      {mode === "paste" && (
        <div className="space-y-2">
          <label className="field" htmlFor="qr-text">Code printed under your QR <small>Starts with TMB1.</small></label>
          <textarea id="qr-text" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} placeholder="TMB1.eyJ1Ijoi…" className="input mono min-h-24 text-xs" />
          <button className="btn btn-sm" onClick={() => (text.trim() ? onToken(text.trim()) : setLocalErr("Paste the code first. It starts with TMB1."))}>Check code</button>
        </div>
      )}

      {samples && samples.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow mr-1">Example people</span>
          {samples.map((s) => (
            <button key={s.uin} onClick={() => onToken(s.token)} className="rounded-full border border-line bg-white px-3 py-1.5 text-sm hover:border-ke-green" title={s.note}>
              {s.name} <span className="text-muted">{s.age}</span>
            </button>
          ))}
        </div>
      )}

      {busy && <p className="flex items-center gap-2 text-sm text-muted"><span className="size-4 animate-spin rounded-full border-2 border-line border-t-ke-green" /> Checking the signature with the registry…</p>}
      {err && <div className="rounded-xl border-l-4 border-ke-red bg-ke-red-soft p-4 text-sm"><b className="block">That QR can&apos;t be used</b>{err}</div>}
    </div>
  );
}
