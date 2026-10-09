import "server-only";
import { signIdentity } from "../crypto";
import { addDays, isoDate, luhnDigit } from "../format";
import { COURIER_FEE, FEES } from "../rules";
import type { Application, Resident, VerifyEvent } from "../types";

// Example records so every screen has something real to show. All people are fictional.
// Photos point at public/images/people/<slug>.jpg — drop real photos there.

type Base = Omit<Resident, "uin" | "token" | "tokenIat" | "qrIssuedAt" | "qrVersion" | "registeredAt" | "photo"> & { base: string; slug: string; qrVersion?: number };

const P = (slug: string) => `/images/people/${slug}.jpg`;

export function buildSeed() {
  const now = new Date();
  const at = (days: number, h = 9, m = 12) => { const d = addDays(now, days); d.setHours(h, m, 0, 0); return d.toISOString(); };
  const slot = (n: number) => { let d = addDays(now, n); while (d.getDay() === 0 || d.getDay() === 6) d = addDays(d, 1); return isoDate(d); };

  const people: Base[] = [
    { base: "70420581136", slug: "faith-mutua", surname: "MUTUA", given: "Faith Nduku", dob: "2008-03-14", sex: "F", county: "Machakos", mother: "Esther Mwikali Mutua", father: "Joseph Mutua Kioko", idNo: null, idStatus: null, photoHash: null, phone: null },
    { base: "71903366420", slug: "brian-otieno", surname: "OTIENO", given: "Brian Ochieng", dob: "2007-11-02", sex: "M", county: "Kisumu", mother: "Rose Akinyi Otieno", father: "Peter Otieno Onyango", idNo: null, idStatus: null, photoHash: "9e3c1c7cfcf8f0e1", phone: "0712345678" },
    { base: "73318820957", slug: "amina-hassan", surname: "HASSAN", given: "Amina Said", dob: "2009-01-20", sex: "F", county: "Mombasa", mother: "Mwanaisha Ali Bakari", father: "Said Hassan Omar", idNo: null, idStatus: null, photoHash: null, phone: null },
    { base: "68127745093", slug: "daniel-kiprop", surname: "KIPROP", given: "Daniel Kiplagat", dob: "1998-06-05", sex: "M", county: "Uasin Gishu", mother: "Grace Jepchirchir", father: "Wilson Kiprop Tanui", idNo: "31884027", idStatus: "Reported lost", photoHash: "1f3f7f7e3c180c1e", phone: "0722908114" },
    { base: "65088214376", slug: "wanjiku-kamau", surname: "KAMAU", given: "Wanjiku Njeri", dob: "1995-08-21", sex: "F", county: "Kiambu", mother: "Lucy Wambui Kamau", father: "Samuel Kamau Gitau", idNo: "29475106", idStatus: "Active", photoHash: "f0e0c0c1e3f7ff7c", phone: "0701223344" },
    { base: "66510937248", slug: "kevin-odhiambo", surname: "ODHIAMBO", given: "Kevin Ouma", dob: "2001-04-09", sex: "M", county: "Kisumu", mother: "Jane Atieno", father: "Tom Odhiambo Ouma", idNo: "38820614", idStatus: "Active", photoHash: "c3e1f0f8781c0e07", phone: "0733110220" },
    { base: "72250418833", slug: "kevin-ouma", surname: "OUMA", given: "Kevin Odhiambo", dob: "2001-04-09", sex: "M", county: "Kisumu", mother: "Jane Atieno Ouma", father: null, idNo: null, idStatus: null, photoHash: "c3e1f0f8781c0e0f", phone: "0712345678" },
    { base: "62904417752", slug: "mercy-rotich", surname: "ROTICH", given: "Mercy Chebet", dob: "1990-12-01", sex: "F", county: "Nakuru", mother: "Sarah Jeptoo", father: "Joel Rotich Kibet", idNo: "27309188", idStatus: "Active", photoHash: "7e7c3c18183c7eff", phone: "0710556677" },
    { base: "61873390514", slug: "abdi-adan", surname: "ADAN", given: "Abdi Noor", dob: "1987-02-17", sex: "M", county: "Garissa", mother: "Halima Abdi", father: "Noor Adan Hussein", idNo: "24661930", idStatus: "Active", photoHash: "ff7e3c1818181c3e", phone: "0727334455", qrVersion: 2 },
    { base: "74016627395", slug: "grace-mwangi", surname: "MWANGI", given: "Grace Wairimu", dob: "2003-07-30", sex: "F", county: "Nyeri", mother: "Ann Nyambura", father: "David Mwangi Maina", idNo: "41207733", idStatus: "Out for delivery", photoHash: "3c7effe7c3c3e77e", phone: "0745667788" },
  ];

  const residents: Resident[] = people.map(({ base, slug, qrVersion, ...p }) => {
    const uin = base + luhnDigit(base);
    const { token, iat } = signIdentity({ uin, dob: p.dob });
    return { ...p, uin, token, tokenIat: iat, qrIssuedAt: qrVersion ? at(-40) : p.dob + "T08:00:00.000Z", qrVersion: qrVersion ?? 1, registeredAt: p.dob + "T08:00:00.000Z", photo: p.idNo ? P(slug) : null };
  });
  const R = (slug: string) => residents[people.findIndex((p) => p.slug === slug)];

  const apps: Application[] = [
    {
      ref: "TMB-2026-481207", uin: R("brian-otieno").uin, type: "first", photo: P("brian-otieno"), photoHash: "9e3c1c7cfcf8f0e1",
      docs: { address: { name: "kplc-bill-sep-2026.pdf", size: 184320, type: "application/pdf", thumb: null } },
      identity: { mode: "home", selfie: P("brian-otieno-selfie"), match: 0.91, centre: null, date: null, time: null },
      delivery: { method: "courier", county: "Kisumu", address: "Milimani Estate, House 14, Kisumu" },
      phone: "0712345678", payment: { receipt: "SIQ4K7B2LM", amount: FEES.first + COURIER_FEE, at: at(-2, 11), checkoutId: "seed-1" },
      status: "submitted", history: [{ s: "submitted", at: at(-2, 11) }], card: null, example: true, createdAt: at(-2, 11),
    },
    {
      ref: "TMB-2026-477915", uin: R("daniel-kiprop").uin, type: "replacement", photo: P("daniel-kiprop"), photoHash: "1f3f7f7e3c180c1e",
      docs: { loss: { name: "police-abstract-OB-114-2026.pdf", size: 241664, type: "application/pdf", thumb: null } },
      identity: { mode: "office", selfie: null, match: null, centre: "eld", date: slot(1), time: "08:30" },
      delivery: { method: "collect", centre: "eld" },
      phone: "0722908114", payment: { receipt: "SIM8R3D0QX", amount: FEES.replacement, at: at(-6, 15), checkoutId: "seed-2" },
      status: "identity", card: null, example: true, createdAt: at(-6, 15),
      history: [{ s: "submitted", at: at(-6, 15) }, { s: "review", at: at(-5, 9), by: "OFF-1042" }, { s: "identity", at: at(-5, 10), note: "Loss report matches OB number on file.", by: "OFF-1042" }],
    },
    {
      ref: "TMB-2026-490336", uin: R("kevin-ouma").uin, type: "first", photo: P("kevin-ouma"), photoHash: "c3e1f0f8781c0e0f",
      docs: {},
      identity: { mode: "home", selfie: P("kevin-ouma-selfie"), match: 0.48, centre: null, date: null, time: null },
      delivery: { method: "courier", county: "Kisumu", address: "Nyalenda B, Kisumu" },
      phone: "0712345678", payment: { receipt: "SIR2P9W4TA", amount: FEES.first + COURIER_FEE, at: at(-1, 16, 40), checkoutId: "seed-3" },
      status: "submitted", history: [{ s: "submitted", at: at(-1, 16, 40) }], card: null, example: true, createdAt: at(-1, 16, 40),
    },
    {
      ref: "TMB-2026-462871", uin: R("grace-mwangi").uin, type: "first", photo: P("grace-mwangi"), photoHash: "3c7effe7c3c3e77e",
      docs: {},
      identity: { mode: "home", selfie: P("grace-mwangi-selfie"), match: 0.88, centre: null, date: null, time: null },
      delivery: { method: "courier", county: "Nyeri", address: "Ruring'u, off Kamakwa Road, Nyeri" },
      phone: "0745667788", payment: { receipt: "SIK7Z1M5RD", amount: FEES.first + COURIER_FEE, at: at(-12, 10), checkoutId: "seed-4" },
      status: "ready", example: true, createdAt: at(-12, 10),
      card: { idNo: "41207733", serial: "A70318842", issued: isoDate(addDays(now, -3)), expiry: isoDate(addDays(now, 365 * 10 - 3)) },
      history: [
        { s: "submitted", at: at(-12, 10) }, { s: "review", at: at(-11, 9), by: "OFF-1042" }, { s: "identity", at: at(-11, 9, 40), by: "OFF-1042" },
        { s: "printing", at: at(-10, 14), note: "ID 41207733 assigned. Selfie match 88%.", by: "OFF-2210" }, { s: "ready", at: at(-1, 8, 30), note: "Handed to courier, Nyeri route", by: "OFF-2210" },
      ],
    },
  ];

  let n = 0;
  const ev = (days: number, h: number, slug: string | null, uinOverride: string | null, verifier: string, purpose: string, outcome: VerifyEvent["outcome"], channel: VerifyEvent["channel"] = "public"): VerifyEvent =>
    ({ id: `seed-ev-${++n}`, at: at(days, h, 5 + n * 3), uin: uinOverride ?? (slug ? R(slug).uin : null), verifier, purpose, channel, outcome, example: true });

  const events: VerifyEvent[] = [
    ev(-9, 10, "wanjiku-kamau", null, "Bank", "Account opening", "valid"),
    ev(-7, 15, "mercy-rotich", null, "Employer", "Staff onboarding", "valid"),
    ev(-5, 11, "kevin-odhiambo", null, "Mobile network", "SIM registration", "valid"),
    ev(-4, 13, "abdi-adan", null, "SACCO", "Loan application", "superseded"),
    ev(-3, 9, "daniel-kiprop", null, "Hotel", "Guest check-in", "lost"),
    ev(-2, 18, "mercy-rotich", null, "Mobile network", "SIM registration", "forged"),
    ev(-2, 18, "mercy-rotich", null, "Mobile network", "SIM registration", "forged"),
    ev(-1, 12, "wanjiku-kamau", null, "University", "Admissions", "valid"),
    ev(-1, 14, "amina-hassan", null, "Tambua", "ID application", "underage", "apply"),
    ev(0, 8, "grace-mwangi", null, "Bank", "Mobile loan limit", "valid"),
  ];

  return { residents, apps, events };
}
