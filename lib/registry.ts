import "server-only";
import { randomUUID } from "node:crypto";
import QRCode from "qrcode";
import { readToken, signIdentity } from "./crypto";
import { store } from "./data/store";
import { ageOn, addDays, fmtDate, isoDate, luhnDigit, randDigits, turns18 } from "./format";
import { COURIER_FEE, FEES, FLOW, isOpen, normPhone, phoneOk, statusLabel } from "./rules";
import type { Application, AppType, Resident, VerifyEvent, VerifyResult } from "./types";

/* ---------- identity QR ---------- */

export async function qrSvg(text: string) {
  return QRCode.toString(text, { type: "svg", errorCorrectionLevel: "L", margin: 2, color: { dark: "#000000", light: "#ffffff" } });
}

type Ctx = { verifier: string; purpose: string; channel: VerifyEvent["channel"] };

async function log(uin: string | null, ctx: Ctx, outcome: VerifyEvent["outcome"]) {
  const s = await store();
  await s.addEvent({ id: randomUUID(), at: new Date().toISOString(), uin, outcome, ...ctx });
}

/** Checks a QR against the registry and records the check in the person's verification log. */
export async function verifyToken(raw: string, ctx: Ctx): Promise<VerifyResult> {
  const t = readToken(raw);
  if (!t.ok) {
    if (t.outcome === "forged") await log(t.claimedUin, ctx, "forged");
    return { ok: false, reason: t.reason, outcome: t.outcome };
  }
  const s = await store();
  const r = await s.getResident(t.claims.u);
  if (!r) {
    await log(t.claims.u, ctx, "unknown");
    return { ok: false, outcome: "unknown", reason: "The signature is genuine, but this identity number is not in the registry." };
  }
  if (r.dob.replace(/-/g, "") !== t.claims.d) {
    await log(r.uin, ctx, "forged");
    return { ok: false, outcome: "forged", resident: r, reason: "The details inside this QR do not match the registry record." };
  }
  if (r.tokenIat !== t.claims.i) {
    await log(r.uin, ctx, "superseded");
    return { ok: false, outcome: "superseded", resident: r, reason: `This QR was replaced on ${fmtDate(r.qrIssuedAt)}. Only the newest QR works. The owner can get a reprint from a registrar.` };
  }
  await log(r.uin, ctx, ctx.channel === "public" && r.idStatus === "Reported lost" ? "lost" : "valid");
  return { ok: true, resident: r };
}

/** The minimum a bank or employer needs. Parents and place of birth never leave the registry. */
export async function publicCheck(raw: string, verifier: string, purpose: string) {
  const v = await verifyToken(raw, { verifier: verifier || "Unnamed verifier", purpose: purpose || "Not stated", channel: "public" });
  if (!v.ok) return { ok: false as const, reason: v.reason, outcome: v.outcome };
  const r = v.resident;
  return {
    ok: true as const,
    name: `${r.given} ${r.surname}`,
    uin: r.uin,
    over18: ageOn(r.dob) >= 18,
    birthYear: r.dob.slice(0, 4),
    idNo: r.idNo,
    idStatus: r.idStatus,
    photo: r.photo,
    checkedAt: new Date().toISOString(),
  };
}

/** What the applicant sees after scanning their QR on the Apply page. */
export async function applicantLookup(raw: string) {
  const v = await verifyToken(raw, { verifier: "Tambua", purpose: "ID application", channel: "apply" });
  if (!v.ok) return { ok: false as const, reason: v.reason };
  const r = v.resident;
  const s = await store();
  const open = (await s.listApps()).find((a) => a.uin === r.uin && isOpen(a.status));
  const age = ageOn(r.dob);
  if (age < 18) await log(r.uin, { verifier: "Tambua", purpose: "ID application", channel: "apply" }, "underage");
  return {
    ok: true as const,
    resident: { uin: r.uin, surname: r.surname, given: r.given, dob: r.dob, sex: r.sex, county: r.county, mother: r.mother, father: r.father, idNo: r.idNo, idStatus: r.idStatus },
    age,
    eligibleFrom: age < 18 ? turns18(r.dob) : null,
    open: open ? { ref: open.ref, status: statusLabel(open.status, open) } : null,
    type: (r.idNo ? "replacement" : "first") as AppType,
  };
}

/* ---------- M-Pesa (simulated STK push) ---------- */

export async function startPayment(phone: string, amount: number) {
  if (!phoneOk(phone)) return { ok: false as const, error: "Enter a Safaricom number like 0712 345 678 or +254 712 345 678." };
  const s = await store();
  const checkoutId = "ws_CO_" + Date.now() + randDigits(4);
  await s.putPayment({ checkoutId, phone: normPhone(phone), amount, createdAt: new Date().toISOString(), status: "pending", receipt: null, usedBy: null });
  return { ok: true as const, checkoutId };
}

export async function pollPayment(checkoutId: string) {
  const s = await store();
  const p = await s.getPayment(checkoutId);
  if (!p) return { status: "missing" as const };
  // Simulation: the customer "enters their PIN" four seconds after the prompt.
  if (p.status === "pending" && Date.now() - Date.parse(p.createdAt) > 4000) {
    p.status = "paid";
    p.receipt = "S" + Array.from({ length: 9 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 34)]).join("");
    await s.putPayment(p);
  }
  return { status: p.status, receipt: p.receipt, amount: p.amount };
}

export async function cancelPayment(checkoutId: string) {
  const s = await store();
  const p = await s.getPayment(checkoutId);
  if (p && p.status === "pending") { p.status = "cancelled"; await s.putPayment(p); }
}

/* ---------- applications ---------- */

export type SubmitInput = {
  token: string;
  photo: string;
  photoHash: string;
  docs: Application["docs"];
  identity: Application["identity"];
  delivery: Application["delivery"];
  phone: string;
  checkoutId: string;
};

export function feeFor(type: AppType, delivery: Application["delivery"]["method"]) {
  return FEES[type] + (delivery === "courier" ? COURIER_FEE : 0);
}

export async function submitApplication(input: SubmitInput): Promise<{ ok: true; ref: string } | { ok: false; error: string }> {
  const s = await store();
  const v = await verifyToken(input.token, { verifier: "Tambua", purpose: "ID application submitted", channel: "apply" });
  if (!v.ok) return { ok: false, error: v.reason };
  const r = v.resident;
  if (ageOn(r.dob) < 18) return { ok: false, error: `Not eligible until ${fmtDate(turns18(r.dob))}.` };
  const apps = await s.listApps();
  const open = apps.find((a) => a.uin === r.uin && isOpen(a.status));
  if (open) return { ok: false, error: `You already have application ${open.ref} in progress.` };
  const type: AppType = r.idNo ? "replacement" : "first";

  if (!input.photo?.startsWith("data:image/")) return { ok: false, error: "Upload a passport photo." };
  if (input.photo.length > 600_000) return { ok: false, error: "The passport photo is too large." };
  if (type === "replacement" && !input.docs.loss) return { ok: false, error: "A replacement needs a police abstract or loss report." };
  if (input.identity.mode === "home" && !input.identity.selfie?.startsWith("data:image/")) return { ok: false, error: "Take a live selfie, or choose an office visit." };
  if (input.identity.mode === "office" && (!input.identity.centre || !input.identity.date || !input.identity.time)) return { ok: false, error: "Book an office visit." };
  if (input.delivery.method === "courier" && (!input.delivery.address?.trim() || !input.delivery.county)) return { ok: false, error: "Add a delivery address." };

  const pay = await s.getPayment(input.checkoutId);
  const fee = feeFor(type, input.delivery.method);
  if (!pay || pay.status !== "paid") return { ok: false, error: "We have not received the M-Pesa payment yet." };
  if (pay.usedBy) return { ok: false, error: "That payment was already used for another application." };
  if (pay.amount !== fee) return { ok: false, error: `The fee is KES ${fee}, but KES ${pay.amount} was paid.` };

  let ref: string;
  do { ref = "TMB-2026-" + randDigits(6); } while (apps.some((a) => a.ref === ref));
  const now = new Date().toISOString();
  const app: Application = {
    ref, uin: r.uin, type, photo: input.photo, photoHash: input.photoHash || null, docs: input.docs,
    identity: input.identity, delivery: input.delivery, phone: pay.phone,
    payment: { receipt: pay.receipt!, amount: pay.amount, at: now, checkoutId: pay.checkoutId },
    status: "submitted", history: [{ s: "submitted", at: now }], card: null, example: false, createdAt: now,
  };
  pay.usedBy = ref;
  await s.putPayment(pay);
  await s.putApp(app);
  return { ok: true, ref };
}

export async function advanceApplication(ref: string, staffNo: string) {
  const s = await store();
  const a = await s.getApp(ref);
  if (!a) return { ok: false as const, error: "Application not found." };
  const next = FLOW[FLOW.indexOf(a.status) + 1];
  if (!next || a.status === "rejected") return { ok: false as const, error: "Nothing left to do on this application." };
  const r = (await s.getResident(a.uin))!;
  const entry: Application["history"][number] = { s: next, at: new Date().toISOString(), by: staffNo };

  if (next === "printing") {
    const today = new Date();
    let idNo = r.idNo;
    if (!idNo || a.type === "first") {
      const taken = new Set((await s.listResidents()).map((x) => x.idNo));
      do { idNo = String(40_000_000 + Math.floor(Math.random() * 9_999_999)); } while (taken.has(idNo));
    }
    a.card = { idNo: idNo!, serial: "A" + randDigits(8), issued: isoDate(today), expiry: isoDate(new Date(today.getFullYear() + 10, today.getMonth(), today.getDate())) };
    r.idNo = idNo; r.idStatus = "Printing"; r.photo = a.photo; r.photoHash = a.photoHash; r.phone = a.phone;
    entry.note = `ID ${idNo} assigned${a.identity.match != null ? `. Selfie match ${Math.round(a.identity.match * 100)}%` : ""}`;
  }
  if (next === "ready") r.idStatus = a.delivery.method === "courier" ? "Out for delivery" : "Ready to collect";
  if (next === "collected") { r.idStatus = "Active"; if (a.delivery.method === "courier") entry.note = "Fingerprints captured by courier at handover"; }

  a.status = next;
  a.history.push(entry);
  await s.putApp(a);
  await s.putResident(r);
  return { ok: true as const, status: next };
}

export async function rejectApplication(ref: string, reason: string, staffNo: string) {
  const s = await store();
  const a = await s.getApp(ref);
  if (!a || !isOpen(a.status) || a.status === "ready") return { ok: false as const, error: "This application can't be rejected now." };
  a.status = "rejected";
  a.history.push({ s: "rejected", at: new Date().toISOString(), note: reason, by: staffNo });
  await s.putApp(a);
  return { ok: true as const };
}

/* ---------- registrar ---------- */

export type BirthInput = { surname: string; given: string; dob: string; sex: "F" | "M"; county: string; mother: string; father: string };

export async function registerBirth(input: BirthInput) {
  const s = await store();
  const surname = input.surname.trim().toUpperCase();
  const given = input.given.trim().replace(/\s+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  if (!surname || !given || !input.dob || !input.mother.trim()) return { ok: false as const, error: "Fill in surname, given names, date of birth and mother's name." };
  if (input.dob > isoDate(new Date())) return { ok: false as const, error: "Date of birth can't be in the future." };
  const all = await s.listResidents();
  let uin: string;
  do { const base = String(1 + Math.floor(Math.random() * 9)) + randDigits(10); uin = base + luhnDigit(base); } while (all.some((r) => r.uin === uin));
  const { token, iat } = signIdentity({ uin, dob: input.dob });
  const now = new Date().toISOString();
  const r: Resident = {
    uin, surname, given, dob: input.dob, sex: input.sex, county: input.county, mother: input.mother.trim(), father: input.father.trim() || null,
    registeredAt: now, token, tokenIat: iat, qrIssuedAt: now, qrVersion: 1, idNo: null, idStatus: null, photo: null, photoHash: null, phone: null,
  };
  await s.putResident(r);
  return { ok: true as const, uin };
}

export async function reissueQr(uin: string) {
  const s = await store();
  const r = await s.getResident(uin);
  if (!r) return { ok: false as const, error: "Not found." };
  const { token, iat } = signIdentity(r);
  r.token = token; r.tokenIat = iat; r.qrIssuedAt = new Date().toISOString(); r.qrVersion += 1;
  await s.putResident(r);
  return { ok: true as const };
}

/* ---------- citizen wallet ---------- */

export async function openWallet(raw: string, dob: string) {
  const v = await verifyToken(raw, { verifier: "You", purpose: "Opened My ID", channel: "wallet" });
  if (!v.ok) return { ok: false as const, error: v.reason };
  if (v.resident.dob !== dob) return { ok: false as const, error: "That date of birth doesn't match the QR. Check it and try again." };
  const s = await store();
  const r = v.resident;
  const [apps, events] = await Promise.all([s.listApps(), s.listEvents()]);
  return {
    ok: true as const,
    resident: { ...r, token: undefined },
    qr: await qrSvg(r.token),
    apps: apps.filter((a) => a.uin === r.uin).map((a) => ({ ref: a.ref, status: a.status, label: statusLabel(a.status, a), createdAt: a.createdAt })),
    checks: events.filter((e) => e.uin === r.uin && e.channel !== "wallet").sort((a, b) => b.at.localeCompare(a.at)).slice(0, 30),
  };
}

export async function reportLost(raw: string, dob: string) {
  const v = await verifyToken(raw, { verifier: "You", purpose: "Reported card lost", channel: "wallet" });
  if (!v.ok || v.resident.dob !== dob) return { ok: false as const, error: "Could not confirm it's you." };
  if (!v.resident.idNo) return { ok: false as const, error: "You don't have an ID card yet." };
  const s = await store();
  const r = v.resident;
  r.idStatus = "Reported lost";
  await s.putResident(r);
  return { ok: true as const };
}

/* ---------- dashboard ---------- */

export async function snapshot() {
  const s = await store();
  const [residents, apps, events] = await Promise.all([s.listResidents(), s.listApps(), s.listEvents()]);
  return { residents, apps, events, kind: s.kind };
}

export function weekAgo() { return addDays(new Date(), -7).toISOString(); }
