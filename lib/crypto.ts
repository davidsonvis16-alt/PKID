import "server-only";
import { createHmac, createPrivateKey, createPublicKey, generateKeyPairSync, sign, timingSafeEqual, verify, type KeyObject } from "node:crypto";
import { luhnOk } from "./format";
import type { Resident } from "./types";

// Identity QR format:  TMB1.<base64url claims>.<base64url ECDSA P-256 signature>
// Claims hold only what is needed to find and match the registry record: {u: uin, d: yyyymmdd, i: issued-at}.

type Keys = { priv: KeyObject; pub: KeyObject; ephemeral: boolean };
const g = globalThis as unknown as { __tambuaKeys?: Keys };

function keys(): Keys {
  if (g.__tambuaKeys) return g.__tambuaKeys;
  const raw = process.env.QR_SIGNING_KEY;
  let k: Keys;
  if (raw) {
    const priv = createPrivateKey(Buffer.from(raw, "base64").toString("utf8"));
    k = { priv, pub: createPublicKey(priv), ephemeral: false };
  } else {
    console.warn("[tambua] QR_SIGNING_KEY is not set. Using a temporary key; run `npm run keygen`.");
    const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
    k = { priv: privateKey, pub: publicKey, ephemeral: true };
  }
  return (g.__tambuaKeys = k);
}

const b64u = (b: Buffer) => b.toString("base64url");

export function signIdentity(r: Pick<Resident, "uin" | "dob">) {
  const iat = Math.floor(Date.now() / 1000);
  const body = b64u(Buffer.from(JSON.stringify({ u: r.uin, d: r.dob.replace(/-/g, ""), i: iat })));
  const sig = sign("sha256", Buffer.from("TMB1." + body), { key: keys().priv, dsaEncoding: "ieee-p1363" });
  return { token: `TMB1.${body}.${b64u(sig)}`, iat };
}

export type TokenClaims = { u: string; d: string; i: number };

export type TokenRead =
  | { ok: true; claims: TokenClaims }
  | { ok: false; reason: string; outcome: "malformed" | "forged"; claimedUin: string | null };

export function readToken(raw: string): TokenRead {
  const tok = String(raw || "").trim();
  const parts = tok.split(".");
  if (parts.length !== 3 || parts[0] !== "TMB1") return { ok: false, outcome: "malformed", claimedUin: null, reason: "This is not a Tambua identity QR. It may be a payment, Wi-Fi or website code." };
  let claims: TokenClaims;
  try { claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")); }
  catch { return { ok: false, outcome: "malformed", claimedUin: null, reason: "The QR is damaged or incomplete. Try a sharper, closer photo." }; }
  const claimedUin = typeof claims?.u === "string" ? claims.u : null;
  let valid = false;
  try { valid = verify("sha256", Buffer.from("TMB1." + parts[1]), { key: keys().pub, dsaEncoding: "ieee-p1363" }, Buffer.from(parts[2], "base64url")); } catch {}
  if (!valid) return { ok: false, outcome: "forged", claimedUin, reason: "The signature does not match the registry key. Someone changed the details inside this QR, or the registry did not issue it." };
  if (!luhnOk(claims.u)) return { ok: false, outcome: "forged", claimedUin, reason: "The identity number inside the QR fails its check digit." };
  return { ok: true, claims };
}

/* ---- staff session cookie ---- */
export type StaffRole = "registrar" | "officer";
export const STAFF_COOKIE = "tambua_staff";

function secret() {
  return process.env.SESSION_SECRET || "dev-only-secret-change-me";
}
export function signSession(role: StaffRole, staffNo: string) {
  const body = b64u(Buffer.from(JSON.stringify({ role, staffNo, exp: Date.now() + 8 * 3600e3 })));
  const mac = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}
export function readSession(v: string | undefined): { role: StaffRole; staffNo: string } | null {
  if (!v) return null;
  const [body, mac] = v.split(".");
  if (!body || !mac) return null;
  const want = createHmac("sha256", secret()).update(body).digest();
  const got = Buffer.from(mac, "base64url");
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (s.exp < Date.now()) return null;
    return { role: s.role, staffNo: s.staffNo };
  } catch { return null; }
}
