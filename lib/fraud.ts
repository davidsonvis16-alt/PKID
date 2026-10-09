import type { Alert, Application, Resident, VerifyEvent } from "./types";
import { fullName } from "./format";
import { isOpen } from "./rules";

export function hamming(a: string, b: string) {
  let d = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) { d += x & 1; x >>= 1; }
  }
  return d;
}
const tokens = (s: string) => new Set(s.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean));
export function nameSimilarity(a: string, b: string) {
  const A = tokens(a), B = tokens(b);
  let inter = 0;
  A.forEach((t) => { if (B.has(t)) inter++; });
  return inter / (A.size + B.size - inter || 1);
}

/** Every rule here runs on each dashboard load. Thresholds are tuned for the example data. */
export function computeAlerts(residents: Resident[], apps: Application[], events: VerifyEvent[]): Alert[] {
  const alerts: Alert[] = [];
  const byUin = new Map(residents.map((r) => [r.uin, r]));
  const name = (uin: string) => { const r = byUin.get(uin); return r ? fullName(r) : uin; };

  // 1. Same face photo behind two different identity numbers
  const photos: { uin: string; hash: string; ref?: string; at: string }[] = [];
  residents.forEach((r) => r.photoHash && photos.push({ uin: r.uin, hash: r.photoHash, at: r.registeredAt }));
  apps.filter((a) => a.status !== "rejected").forEach((a) => a.photoHash && photos.push({ uin: a.uin, hash: a.photoHash, ref: a.ref, at: a.createdAt }));
  const seenPair = new Set<string>();
  for (let i = 0; i < photos.length; i++) for (let j = i + 1; j < photos.length; j++) {
    const p = photos[i], q = photos[j];
    if (p.uin === q.uin) continue;
    const d = hamming(p.hash, q.hash);
    const key = [p.uin, q.uin].sort().join("|");
    if (d <= 6 && !seenPair.has(key)) {
      seenPair.add(key);
      alerts.push({ id: `photo-${key}`, severity: "high", kind: "photo-duplicate", title: "Same face on two identities",
        detail: `${name(p.uin)} and ${name(q.uin)} have near-identical passport photos (${64 - d}/64 hash bits match).`,
        uins: [p.uin, q.uin], refs: [p.ref, q.ref].filter(Boolean) as string[], at: p.at > q.at ? p.at : q.at });
    }
  }

  // 2. Possible double registration: same birth date and a near-identical name
  for (let i = 0; i < residents.length; i++) for (let j = i + 1; j < residents.length; j++) {
    const a = residents[i], b = residents[j];
    if (a.dob !== b.dob) continue;
    const sim = nameSimilarity(fullName(a), fullName(b));
    if (sim >= 0.6) alerts.push({ id: `name-${a.uin}-${b.uin}`, severity: "high", kind: "name-duplicate", title: "Possible double birth registration",
      detail: `${fullName(a)} and ${fullName(b)} share a birth date (${a.dob}) and ${Math.round(sim * 100)}% of their names. Mothers on record: ${a.mother} / ${b.mother}.`,
      uins: [a.uin, b.uin], refs: [], at: a.registeredAt > b.registeredAt ? a.registeredAt : b.registeredAt });
  }

  // 3. One M-Pesa number paying for several people
  const phones = new Map<string, Application[]>();
  apps.forEach((a) => phones.set(a.phone, [...(phones.get(a.phone) ?? []), a]));
  phones.forEach((list, phone) => {
    const uins = [...new Set(list.map((a) => a.uin))];
    if (uins.length > 1) alerts.push({ id: `phone-${phone}`, severity: "medium", kind: "shared-phone", title: "One phone, several applicants",
      detail: `${phone} paid for ${uins.length} different people: ${uins.map(name).join(", ")}. Agents sometimes do this; so do fraud rings.`,
      uins, refs: list.map((a) => a.ref), at: list.map((a) => a.createdAt).sort().at(-1)! });
  });

  // 4–6. Verification events that point at forgery or theft
  const group = (outcome: VerifyEvent["outcome"]) => {
    const m = new Map<string, VerifyEvent[]>();
    events.filter((e) => e.outcome === outcome).forEach((e) => { const k = e.uin ?? "unknown"; m.set(k, [...(m.get(k) ?? []), e]); });
    return m;
  };
  group("forged").forEach((list, uin) => alerts.push({ id: `forged-${uin}`, severity: "high", kind: "forged-qr", title: "Forged QR presented",
    detail: `${list.length} scan${list.length > 1 ? "s" : ""} of a QR claiming to be ${uin === "unknown" ? "an unknown person" : name(uin)} failed the signature check. Last at ${list.at(-1)!.verifier} (${list.at(-1)!.purpose}).`,
    uins: uin === "unknown" ? [] : [uin], refs: [], at: list.at(-1)!.at }));
  group("superseded").forEach((list, uin) => alerts.push({ id: `old-${uin}`, severity: "medium", kind: "old-qr", title: "Replaced QR still in use",
    detail: `Someone showed ${name(uin)}'s old QR at ${list.at(-1)!.verifier} after it was replaced. The old code may be in someone else's hands.`,
    uins: [uin], refs: [], at: list.at(-1)!.at }));
  group("lost").forEach((list, uin) => alerts.push({ id: `lost-${uin}`, severity: "high", kind: "lost-card", title: "Lost ID being used",
    detail: `${name(uin)}'s card is reported lost, but it was presented at ${list.at(-1)!.verifier} (${list.at(-1)!.purpose}).`,
    uins: [uin], refs: [], at: list.at(-1)!.at }));
  group("underage").forEach((list, uin) => alerts.push({ id: `under-${uin}`, severity: "medium", kind: "underage", title: "Under-18 application attempt",
    detail: `${name(uin)} tried to apply before turning 18 (${list.length} attempt${list.length > 1 ? "s" : ""}).`, uins: [uin], refs: [], at: list.at(-1)!.at }));

  // 7. Weak selfie match on a home identity check
  apps.filter((a) => isOpen(a.status) && a.identity.mode === "home" && a.identity.match !== null && a.identity.match < 0.6).forEach((a) =>
    alerts.push({ id: `selfie-${a.ref}`, severity: "high", kind: "selfie-mismatch", title: "Selfie does not match photo",
      detail: `${name(a.uin)}'s live selfie scored ${Math.round(a.identity.match! * 100)}% against the passport photo. Ask for an office visit.`,
      uins: [a.uin], refs: [a.ref], at: a.createdAt }));

  return alerts.sort((a, b) => (a.severity === b.severity ? b.at.localeCompare(a.at) : a.severity === "high" ? -1 : 1));
}
