const pad2 = (n: number) => String(n).padStart(2, "0");
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const asDate = (d: string | Date) => (typeof d === "string" && d.length === 10 ? new Date(d + "T00:00:00") : new Date(d));

export const fmtDate = (d: string | Date) => asDate(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
export const fmtDateTime = (d: string | Date) => asDate(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
export const fmtLongDay = (d: string) => asDate(d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
export const kes = (n: number) => "KES " + n.toLocaleString("en-KE");
export const fmtUIN = (u: string) => u.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3");
export const fullName = (r: { given: string; surname: string }) => `${r.given} ${r.surname}`;

export function ageOn(dob: string, on = new Date()) {
  const b = asDate(dob);
  let a = on.getFullYear() - b.getFullYear();
  const m = on.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && on.getDate() < b.getDate())) a--;
  return a;
}
export const turns18 = (dob: string) => { const b = asDate(dob); return isoDate(new Date(b.getFullYear() + 18, b.getMonth(), b.getDate())); };

export function luhnDigit(num: string) {
  let s = 0, dbl = true;
  for (let i = num.length - 1; i >= 0; i--) { let d = +num[i]; if (dbl) { d *= 2; if (d > 9) d -= 9; } s += d; dbl = !dbl; }
  return String((10 - (s % 10)) % 10);
}
export const luhnOk = (n: string) => /^\d{12}$/.test(n) && luhnDigit(n.slice(0, -1)) === n.slice(-1);
export const randDigits = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");

export function workingDays(n: number, from = new Date()) {
  const out: string[] = [];
  let d = addDays(from, 1);
  while (out.length < n) { if (d.getDay() !== 0 && d.getDay() !== 6) out.push(isoDate(d)); d = addDays(d, 1); }
  return out;
}
/** Deterministic "fully booked" slots so the calendar looks lived-in. */
export function slotFull(centre: string, date: string, time: string) {
  let h = 0;
  for (const ch of centre + date + time) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 5 === 0;
}
