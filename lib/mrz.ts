import type { Card, Resident } from "./types";

// ICAO Doc 9303, TD1 (ID-1 card) machine readable zone. "UTO" is ICAO's specimen state code.
function check(s: string) {
  const w = [7, 3, 1];
  let t = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const v = c === "<" ? 0 : /\d/.test(c) ? +c : c.charCodeAt(0) - 55;
    t += v * w[i % 3];
  }
  return String(t % 10);
}
const fill = (s: string, n: number) => (s + "<".repeat(n)).slice(0, n);
const yymmdd = (d: string) => d.slice(2, 4) + d.slice(5, 7) + d.slice(8, 10);

export function mrz(r: Resident, card: Card): [string, string, string] {
  const doc = fill(card.serial, 9);
  const l1 = fill("ID" + "UTO" + doc + check(doc) + r.uin, 30);
  const dob = yymmdd(r.dob), exp = yymmdd(card.expiry);
  let l2 = dob + check(dob) + r.sex + exp + check(exp) + "UTO" + fill("", 11);
  l2 += check(l1.slice(5, 30) + l2.slice(0, 7) + l2.slice(8, 15) + l2.slice(18, 29));
  const l3 = fill((r.surname + "<<" + r.given.replace(/\s+/g, "<")).toUpperCase().replace(/[^A-Z<]/g, "<"), 30);
  return [l1, l2, l3];
}
