"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { lookupApplicant, payCancel, payPoll, payStart, submitApplication } from "@/app/actions";
import { aHash, drawTo, hashSimilarity, loadImage, toJpeg } from "@/lib/image-client";
import { fmtDate, fmtLongDay, fmtUIN, kes, slotFull, workingDays } from "@/lib/format";
import { CENTRES, COUNTIES, COURIER_FEE, FEES, TIMES, centreName, prettyPhone } from "@/lib/rules";
import type { Application, UploadedDoc } from "@/lib/types";
import { Camera } from "./Camera";
import { IconCamera, IconCheck, IconTruck, IconUpload } from "./Icons";
import { QrInput, type Sample } from "./QrInput";

type Lookup = Awaited<ReturnType<typeof lookupApplicant>>;
type Found = Extract<Lookup, { ok: true }>;

const STEPS = [
  ["Identity QR", "Instead of a birth certificate"],
  ["Photo & documents", "Passport photo and extras"],
  ["Identity check", "Selfie at home or office visit"],
  ["Delivery", "Courier or collect"],
  ["Payment", "M-Pesa"],
  ["Review", "Check and submit"],
] as const;

export function ApplyWizard({ samples }: { samples: Sample[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [token, setToken] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [qrErr, setQrErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [photo, setPhoto] = useState<string | null>(null);
  const [photoHash, setPhotoHash] = useState("");
  const [docs, setDocs] = useState<Application["docs"]>({});
  const [docErr, setDocErr] = useState("");

  const [mode, setMode] = useState<"home" | "office">("home");
  const [selfie, setSelfie] = useState<string | null>(null);
  const [match, setMatch] = useState<number | null>(null);
  const [camOn, setCamOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [centre, setCentre] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [delivery, setDelivery] = useState<"courier" | "collect">("courier");
  const [county, setCounty] = useState("Nairobi");
  const [address, setAddress] = useState("");
  const [collectAt, setCollectAt] = useState("");

  const [phone, setPhone] = useState("");
  const [pay, setPay] = useState<{ id: string; state: "pending" | "paid"; receipt?: string | null } | null>(null);
  const [payErr, setPayErr] = useState("");

  const [consent, setConsent] = useState(false);
  const [submitErr, setSubmitErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const type = found?.type ?? "first";
  const fee = FEES[type] + (delivery === "courier" ? COURIER_FEE : 0);
  const collectCentre = mode === "office" && centre ? centre : collectAt;

  const ok = [
    !!found && found.age >= 18 && !found.open,
    !!photo && (type === "first" || !!docs.loss),
    mode === "home" ? !!selfie : !!(centre && date && time),
    delivery === "courier" ? address.trim().length > 5 : !!collectCentre,
    pay?.state === "paid",
  ];
  const maxStep = ok.indexOf(false) === -1 ? 5 : ok.indexOf(false);
  const go = (i: number) => { if (i <= maxStep) { setStep(i); window.scrollTo({ top: 0, behavior: "smooth" }); } };

  async function onToken(t: string) {
    setBusy(true); setQrErr(""); setFound(null);
    const res = await lookupApplicant(t);
    setBusy(false);
    if (!res.ok) { setQrErr(res.reason); return; }
    setToken(t); setFound(res);
    setPhoto(null); setDocs({}); setSelfie(null); setMatch(null); setPay(null);
  }

  async function onPhoto(f?: File | null) {
    if (!f) return;
    setDocErr("");
    try {
      if (!f.type.startsWith("image/")) throw new Error("The passport photo must be a JPG or PNG image.");
      if (f.size > 8 * 1024 * 1024) throw new Error("That photo is over 8 MB. Use a smaller one.");
      const img = await loadImage(f);
      if (img.naturalWidth < 300 || img.naturalHeight < 380) throw new Error(`That photo is ${img.naturalWidth} × ${img.naturalHeight} px. Use one at least 300 × 380 px so the card prints sharp.`);
      const cv = drawTo(img, 350, 450, true);
      setPhoto(toJpeg(cv)); setPhotoHash(await aHash(cv));
      setSelfie(null); setMatch(null);
    } catch (e) { setDocErr((e as Error).message); }
  }

  async function onDoc(key: "loss" | "address", f?: File | null) {
    if (!f) return;
    setDocErr("");
    try {
      if (f.size > 5 * 1024 * 1024) throw new Error(`${f.name} is ${(f.size / 1048576).toFixed(1)} MB. The limit is 5 MB.`);
      let thumb: string | null = null;
      if (f.type.startsWith("image/")) thumb = toJpeg(drawTo(await loadImage(f), 480, 480, false), 0.75);
      else if (f.type !== "application/pdf") throw new Error("Use an image or a PDF.");
      const doc: UploadedDoc = { name: f.name, size: f.size, type: f.type, thumb };
      setDocs((d) => ({ ...d, [key]: doc }));
    } catch (e) { setDocErr((e as Error).message); }
  }

  async function takeSelfie(cv: HTMLCanvasElement) {
    setSelfie(toJpeg(cv));
    const h = await aHash(cv);
    setMatch(photoHash ? hashSimilarity(h, photoHash) : null);
    setCamOn(false);
  }

  async function startPay() {
    setPayErr("");
    const res = await payStart(phone, fee);
    if (!res.ok) { setPayErr(res.error); return; }
    setPay({ id: res.checkoutId, state: "pending" });
  }
  useEffect(() => {
    if (pay?.state !== "pending") return;
    const t = setInterval(async () => {
      const r = await payPoll(pay.id);
      if (r.status === "paid") { setPay({ id: pay.id, state: "paid", receipt: r.receipt }); clearInterval(t); }
      if (r.status === "cancelled" || r.status === "missing") { setPay(null); clearInterval(t); }
    }, 1500);
    return () => clearInterval(t);
  }, [pay]);

  async function submit() {
    if (!found || !pay) return;
    setSubmitting(true); setSubmitErr("");
    const res = await submitApplication({
      token, photo: photo!, photoHash, docs,
      identity: mode === "home" ? { mode, selfie, match, centre: null, date: null, time: null } : { mode, selfie: null, match: null, centre, date, time },
      delivery: delivery === "courier" ? { method: "courier", county, address: address.trim() } : { method: "collect", centre: collectCentre },
      phone, checkoutId: pay.id,
    });
    if (res.ok) router.push(`/apply/done/${res.ref}`);
    else { setSubmitErr(res.error); setSubmitting(false); }
  }

  const days = workingDays(10);
  const r = found?.resident;

  const Foot = ({ back, next, nextLabel = "Continue" }: { back?: number; next?: number; nextLabel?: string }) => (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
      {back !== undefined ? <button className="btn" onClick={() => go(back)}>Back</button> : <span className="text-xs text-muted">Your QR holds a signed record, not a password.</span>}
      {next !== undefined && <button className="btn-green" disabled={maxStep < next} onClick={() => go(next)}>{nextLabel}</button>}
    </div>
  );

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[250px_1fr]">
      <ol className="flex gap-1 overflow-x-auto pb-1 lg:sticky lg:top-6 lg:grid lg:overflow-visible">
        {STEPS.map(([t, s], i) => {
          const state = i === step ? "cur" : i < step && i <= maxStep ? "done" : "todo";
          return (
            <li key={t} className="shrink-0">
              <button disabled={i > maxStep} onClick={() => go(i)} aria-current={i === step ? "step" : undefined}
                className={`grid w-full grid-cols-[30px_1fr] items-start gap-x-3 rounded-xl px-3 py-2.5 text-left transition disabled:opacity-45 ${state === "cur" ? "bg-white shadow-sm ring-1 ring-line" : "hover:bg-white/60"}`}>
                <span className={`mono row-span-2 grid size-7 place-items-center rounded-full border-2 text-xs font-semibold ${state === "done" ? "border-ke-green bg-ke-green text-white" : state === "cur" ? "border-ke-black bg-ke-black text-white" : "border-line"}`}>
                  {state === "done" ? <IconCheck className="size-3.5" /> : i + 1}
                </span>
                <span className={`text-sm font-semibold ${state === "cur" ? "" : "hidden lg:block"}`}>{t}</span>
                <span className="hidden text-xs text-muted lg:block">{s}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="panel grid gap-6 p-5 sm:p-8">
        <div>
          <p className="eyebrow">Step {step + 1} of {STEPS.length}</p>
          <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{["Show your identity QR", "Passport photo and documents", "Confirm it's really you", "Where should your card go?", "Pay the application fee", "Check and submit"][step]}</h2>
        </div>

        {step === 0 && (
          <>
            <p className="max-w-2xl text-muted">This replaces your birth certificate, your parents&apos; ID copies and the chief&apos;s letter. We check the registry&apos;s signature, then pull your record.</p>
            <QrInput onToken={onToken} samples={samples} busy={busy} error={qrErr} />
            {r && found && (
              <div className="overflow-hidden rounded-xl border border-line">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-paper px-5 py-3">
                  <div><p className="eyebrow">Registry record</p><b className="font-display text-lg">{r.given} {r.surname}</b></div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-ke-green-soft px-3 py-1 text-xs font-semibold text-ke-green"><IconCheck className="size-3.5" /> Signature valid</span>
                </div>
                <dl className="grid grid-cols-2 sm:grid-cols-3">
                  {[["Identity number", fmtUIN(r.uin), true], ["Date of birth", `${fmtDate(r.dob)} (${found.age})`], ["Sex", r.sex === "F" ? "Female" : "Male"], ["Place of birth", `${r.county} County`], ["Mother", r.mother], ["Father", r.father ?? "Not recorded"]].map(([k, v, m]) => (
                    <div key={k as string} className="border-t border-line px-5 py-3"><dt className="text-xs uppercase tracking-wider text-muted">{k}</dt><dd className={`font-semibold ${m ? "mono" : ""}`}>{v}</dd></div>
                  ))}
                </dl>
              </div>
            )}
            {found && found.age < 18 && <Notice tone="warn" title="Not eligible yet">{found.resident.given.split(" ")[0]} turns 18 on {fmtDate(found.eligibleFrom!)}. Come back that day with the same QR. We logged this attempt.</Notice>}
            {found && found.open && <Notice tone="info" title="You already have an application in progress">Reference <a className="mono font-semibold underline" href={`/track/${found.open.ref}`}>{found.open.ref}</a> is {found.open.status.toLowerCase()}. One application at a time.</Notice>}
            {found && found.age >= 18 && !found.open && (
              <Notice tone="ok" title={type === "replacement" ? `Replacement for ID ${r!.idNo}` : "Eligible for a first ID card"}>
                {type === "replacement" ? "You'll need a police abstract or loss report. You keep the same ID number." : "Your parents and place of birth come from the registry, so there's nothing to prove."}
              </Notice>
            )}
            <Foot next={1} />
          </>
        )}

        {step === 1 && (
          <>
            <div className="rounded-xl bg-ke-green-soft p-4">
              <p className="eyebrow !text-ke-green">Not needed: your QR covers these</p>
              <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">{["Birth certificate", "Parents' ID copies", "Chief's letter", "Age assessment"].map((d) => <span key={d} className="line-through decoration-ke-green decoration-2">{d}</span>)}</p>
            </div>
            <DocRow title="Passport photo" required desc="Plain light background, face and shoulders, no glasses. We crop it to 35 × 45 mm."
              preview={photo ? <img src={photo} alt="Your passport photo" className="h-full w-full object-cover" /> : "35×45"}
              meta={photo ? "Cropped to 350 × 450 px" : ""} accept="image/jpeg,image/png" onFile={onPhoto} onRemove={photo ? () => { setPhoto(null); setPhotoHash(""); } : undefined} tall />
            {type === "replacement" && <DocRow title="Police abstract or loss report" required desc="The OB number must be readable. Photo or PDF, up to 5 MB."
              preview={docs.loss?.thumb ? <img src={docs.loss.thumb} alt="" className="h-full w-full object-cover" /> : docs.loss ? "PDF" : "None"}
              meta={docs.loss ? `${docs.loss.name} · ${(docs.loss.size / 1024).toFixed(0)} KB` : ""} accept="image/*,application/pdf" onFile={(f) => onDoc("loss", f)} onRemove={docs.loss ? () => setDocs(({ loss: _, ...d }) => d) : undefined} />}
            <DocRow title="Proof of address" desc="A recent utility bill or tenancy letter. Speeds up courier delivery."
              preview={docs.address?.thumb ? <img src={docs.address.thumb} alt="" className="h-full w-full object-cover" /> : docs.address ? "PDF" : "None"}
              meta={docs.address ? `${docs.address.name} · ${(docs.address.size / 1024).toFixed(0)} KB` : ""} accept="image/*,application/pdf" onFile={(f) => onDoc("address", f)} onRemove={docs.address ? () => setDocs(({ address: _, ...d }) => d) : undefined} />
            {docErr && <Notice tone="bad" title="Upload failed">{docErr}</Notice>}
            <Foot back={0} next={2} />
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Choice on={mode === "home"} onClick={() => setMode("home")} title="From home, with a live selfie" tag="No queue" body="Take a selfie now. An officer compares it with your passport photo. Fingerprints are taken by the courier when your card arrives." />
              <Choice on={mode === "office"} onClick={() => setMode("office")} title="At a registration office" body="Book a 15-minute slot for fingerprints and a live photo." />
            </div>
            {mode === "home" && (
              <div className="grid gap-5 md:grid-cols-[1fr_160px]">
                <div className="space-y-3">
                  {camOn ? (
                    <>
                      <Camera facing="user" mirror className="aspect-[4/3] w-full" onFrame={(v) => { videoRef.current = v; }}
                        overlay={<div className="pointer-events-none absolute inset-0 grid place-items-center"><div className="aspect-[35/45] h-[80%] rounded-[45%] border-4 border-white/85 shadow-[0_0_0_9999px_rgb(0_0_0/0.4)]" /></div>} />
                      <div className="flex flex-wrap gap-2">
                        <button className="btn-green" onClick={() => videoRef.current && takeSelfie(drawTo(videoRef.current, 350, 450, true, true))}><IconCamera className="size-4" /> Capture</button>
                        <button className="btn" onClick={() => setCamOn(false)}>Cancel</button>
                      </div>
                      <p className="text-sm text-muted">Face the light, remove glasses, keep your face inside the oval.</p>
                    </>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button className="btn-green" onClick={() => setCamOn(true)}><IconCamera className="size-4" /> {selfie ? "Retake selfie" : "Open camera"}</button>
                      <label className="btn cursor-pointer"><IconUpload className="size-4" /> Upload instead
                        <input type="file" accept="image/*" capture="user" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) takeSelfie(drawTo(await loadImage(f), 350, 450, true)); }} />
                      </label>
                    </div>
                  )}
                  {match !== null && (
                    <Notice tone={match >= 0.6 ? "ok" : "warn"} title={`Photo similarity ${Math.round(match * 100)}%`}>
                      {match >= 0.6 ? "Looks consistent. An officer still confirms it by eye." : "Low match. You can retake it in better light, or an officer may ask you to visit an office."}
                    </Notice>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
                  <figure className="space-y-1"><div className="aspect-[35/45] overflow-hidden rounded-lg border border-line bg-paper">{photo && <img src={photo} alt="Passport photo" className="h-full w-full object-cover" />}</div><figcaption className="text-xs text-muted">Passport photo</figcaption></figure>
                  <figure className="space-y-1"><div className="grid aspect-[35/45] place-items-center overflow-hidden rounded-lg border border-line bg-paper text-xs text-muted">{selfie ? <img src={selfie} alt="Your selfie" className="h-full w-full object-cover" /> : "Selfie"}</div><figcaption className="text-xs text-muted">Live selfie</figcaption></figure>
                </div>
              </div>
            )}
            {mode === "office" && (
              <div className="space-y-5">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {CENTRES.map((c) => <Choice key={c.id} on={centre === c.id} onClick={() => { setCentre(c.id); setTime(""); }} title={c.name} body={c.addr} compact />)}
                </div>
                {centre && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {days.map((d) => { const dt = new Date(d + "T00:00:00"); const on = date === d; return (
                      <button key={d} onClick={() => { setDate(d); setTime(""); }} className={`grid w-16 shrink-0 rounded-xl border py-2 text-center transition ${on ? "border-ke-black bg-ke-black text-white" : "border-line bg-white hover:border-ink/40"}`}>
                        <span className="text-[0.68rem] uppercase opacity-70">{dt.toLocaleDateString("en-GB", { weekday: "short" })}</span>
                        <span className="font-display text-xl font-bold">{dt.getDate()}</span>
                        <span className="text-[0.68rem] uppercase opacity-70">{dt.toLocaleDateString("en-GB", { month: "short" })}</span>
                      </button>); })}
                  </div>
                )}
                {centre && date && (
                  <div className="flex flex-wrap gap-2">
                    {TIMES.map((t) => { const full = slotFull(centre, date, t); return (
                      <button key={t} disabled={full} onClick={() => setTime(t)} className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:line-through disabled:opacity-40 ${time === t ? "border-ke-green bg-ke-green text-white" : "border-line hover:border-ke-green"}`}>{t}{full ? " · full" : ""}</button>); })}
                  </div>
                )}
              </div>
            )}
            <Foot back={1} next={3} />
          </>
        )}

        {step === 3 && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Choice on={delivery === "courier"} onClick={() => { if (pay?.state !== "paid") setDelivery("courier"); }} title={`Deliver to me · +${kes(COURIER_FEE)}`} tag="Recommended" body="The courier calls ahead, checks your QR, and captures your fingerprints at handover." icon={<IconTruck className="size-5" />} />
              <Choice on={delivery === "collect"} onClick={() => { if (pay?.state !== "paid") setDelivery("collect"); }} title="Collect at an office · free" body="We SMS you when it's ready. Bring your QR." />
            </div>
            {pay?.state === "paid" && <p className="text-sm text-muted">Delivery choice is locked because the fee is already paid.</p>}
            {delivery === "courier" ? (
              <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
                <label className="field" htmlFor="county">County<select id="county" className="input" value={county} onChange={(e) => setCounty(e.target.value)}>{COUNTIES.map((c) => <option key={c}>{c}</option>)}</select></label>
                <label className="field" htmlFor="address">Delivery address <small>Estate, street, house or a landmark the rider can find</small><input id="address" className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Kileleshwa, Othaya Road, Apt 4B" /></label>
              </div>
            ) : mode === "office" && centre ? (
              <Notice tone="info" title="Collect where you do your biometrics">{centreName(centre)}</Notice>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{CENTRES.map((c) => <Choice key={c.id} on={collectAt === c.id} onClick={() => setCollectAt(c.id)} title={c.name} body={c.addr} compact />)}</div>
            )}
            <Foot back={2} next={4} />
          </>
        )}

        {step === 4 && (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-3 rounded-xl border border-line p-5">
              <div><b>{type === "replacement" ? "Replacement ID card" : "First ID card"}</b>{delivery === "courier" && <span className="text-muted"> + courier to {county}</span>}<p className="text-sm text-muted">Includes printing and SMS updates at every stage</p></div>
              <span className="mono text-3xl font-semibold">{kes(fee)}</span>
            </div>
            <div className="space-y-4 rounded-xl border border-line p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Official M-Pesa logo goes in public/brand/mpesa.svg */}
                <BrandLogo src="/brand/mpesa.svg" alt="M-Pesa" fallback="M-PESA" />
                <span className="rounded border border-dashed border-line px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wider text-muted">Simulated STK push · no money moves</span>
              </div>
              {pay?.state === "paid" ? (
                <Notice tone="ok" title="Payment received">M-Pesa receipt <span className="mono font-semibold">{pay.receipt}</span> · {kes(fee)} from {prettyPhone(phone)}</Notice>
              ) : pay?.state === "pending" ? (
                <div className="flex flex-wrap items-center gap-4">
                  <span className="size-6 animate-spin rounded-full border-[3px] border-line border-t-ke-green" />
                  <div className="flex-1"><b>Check your phone</b><p className="text-sm text-muted">Enter your M-Pesa PIN on the prompt sent to {prettyPhone(phone)}.</p></div>
                  <button className="btn btn-sm" onClick={async () => { await payCancel(pay.id); setPay(null); }}>Cancel</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="field" htmlFor="phone">M-Pesa phone number <small>We send the payment prompt and your SMS updates here</small></label>
                  <div className="flex flex-wrap gap-2">
                    <input id="phone" className="input max-w-60" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    <button className="btn-green" onClick={startPay}>Send payment request</button>
                  </div>
                  {payErr && <p className="text-sm text-ke-red">{payErr}</p>}
                </div>
              )}
            </div>
            <Foot back={3} next={5} />
          </>
        )}

        {step === 5 && r && (
          <>
            <div className="grid gap-6 md:grid-cols-[1fr_150px]">
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[170px_1fr]">
                {[
                  ["Applicant", `${r.given} ${r.surname}`],
                  ["Identity number", fmtUIN(r.uin)],
                  ["Application", type === "replacement" ? `Replacement of ID ${r.idNo}` : "First ID card"],
                  ["Documents", ["Passport photo", docs.loss && "Police abstract", docs.address && "Proof of address"].filter(Boolean).join(", ")],
                  ["Identity check", mode === "home" ? `Live selfie${match !== null ? ` (${Math.round(match * 100)}% similarity)` : ""}` : `${centreName(centre)}, ${fmtLongDay(date)} at ${time}`],
                  ["Card", delivery === "courier" ? `Courier to ${address}, ${county}` : `Collect at ${centreName(collectCentre)}`],
                  ["Paid", `${kes(fee)} · ${pay?.receipt}`],
                ].map(([k, v]) => <div key={k} className="contents"><dt className="text-sm text-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
              </dl>
              <div className="aspect-[35/45] overflow-hidden rounded-lg border border-line">{photo && <img src={photo} alt="Photo for your card" className="h-full w-full object-cover" />}</div>
            </div>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 size-4 accent-ke-green" />
              <span>The details from my registry record are correct, and I agree to have my fingerprints captured {delivery === "courier" && mode === "home" ? "when the card is delivered" : "at my visit"}.</span>
            </label>
            {submitErr && <Notice tone="bad" title="Could not submit">{submitErr}</Notice>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <button className="btn" onClick={() => go(4)}>Back</button>
              <button className="btn-green px-6" disabled={!consent || submitting} onClick={submit}>{submitting ? "Submitting…" : "Submit application"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Notice({ tone, title, children }: { tone: "ok" | "warn" | "bad" | "info"; title: string; children: React.ReactNode }) {
  const c = { ok: "border-ke-green bg-ke-green-soft", warn: "border-amber bg-amber-soft", bad: "border-ke-red bg-ke-red-soft", info: "border-sky bg-sky-soft" }[tone];
  return <div className={`rounded-xl border-l-4 p-4 text-sm ${c}`}><b className="mb-0.5 block text-[0.95rem]">{title}</b>{children}</div>;
}

function Choice({ on, onClick, title, body, tag, icon, compact }: { on: boolean; onClick: () => void; title: string; body: string; tag?: string; icon?: React.ReactNode; compact?: boolean }) {
  return (
    <button onClick={onClick} aria-pressed={on} className={`grid gap-1 rounded-xl border text-left transition ${compact ? "p-3" : "p-4"} ${on ? "border-ke-green bg-ke-green-soft ring-1 ring-ke-green" : "border-line bg-white hover:border-ink/30"}`}>
      <span className="flex flex-wrap items-center gap-2 font-semibold">{icon}{title}{tag && <span className="rounded-full bg-ke-black px-2 py-0.5 text-[0.66rem] font-semibold uppercase tracking-wider text-white">{tag}</span>}</span>
      <span className="text-sm text-muted">{body}</span>
    </button>
  );
}

function DocRow({ title, desc, required, preview, meta, accept, onFile, onRemove, tall }: { title: string; desc: string; required?: boolean; preview: React.ReactNode; meta: string; accept: string; onFile: (f?: File | null) => void; onRemove?: () => void; tall?: boolean }) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-4 rounded-xl border border-line p-4 sm:grid-cols-[auto_1fr_auto]">
      <div className={`mono grid place-items-center overflow-hidden rounded-lg border border-line bg-paper text-[0.65rem] font-semibold text-muted ${tall ? "h-24 w-[74px]" : "h-[74px] w-24"}`}>{preview}</div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><b>{title}</b><span className="rounded border border-dashed border-line px-1.5 text-[0.66rem] font-semibold uppercase tracking-wider text-muted">{required ? "Required" : "Optional"}</span></div>
        <p className="text-sm text-muted">{desc}</p>
        {meta && <p className="mono mt-1 break-all text-xs">{meta}</p>}
      </div>
      <div className="col-span-2 flex gap-2 sm:col-span-1">
        <label className="btn btn-sm cursor-pointer">{onRemove ? "Replace" : "Upload"}<input type="file" accept={accept} className="sr-only" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} /></label>
        {onRemove && <button className="btn btn-sm" onClick={onRemove}>Remove</button>}
      </div>
    </div>
  );
}

function BrandLogo({ src, alt, fallback }: { src: string; alt: string; fallback: string }) {
  const [broken, setBroken] = useState(false);
  return broken
    ? <span className="font-display text-xl font-extrabold tracking-wide text-ke-green">{fallback}</span>
    // eslint-disable-next-line @next/next/no-img-element
    : <img src={src} alt={alt} className="h-8 w-auto" onError={() => setBroken(true)} />;
}
