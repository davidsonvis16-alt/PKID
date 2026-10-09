import "server-only";
import type { Application, Payment, Resident, VerifyEvent } from "../types";
import { buildSeed } from "./seed";
import type { Store } from "./store";

type Mem = { residents: Map<string, Resident>; apps: Map<string, Application>; payments: Map<string, Payment>; events: VerifyEvent[] };
// Kept on globalThis so data survives hot reloads in `next dev`. It resets when the server restarts.
const g = globalThis as unknown as { __tambuaMem?: Mem };

function fresh(): Mem {
  const s = buildSeed();
  return {
    residents: new Map(s.residents.map((r) => [r.uin, r])),
    apps: new Map(s.apps.map((a) => [a.ref, a])),
    payments: new Map(),
    events: s.events,
  };
}
const mem = () => (g.__tambuaMem ??= fresh());
const clone = <T,>(x: T): T => structuredClone(x);

export function memoryStore(): Store {
  return {
    kind: "memory",
    async listResidents() { return clone([...mem().residents.values()]); },
    async getResident(uin) { const r = mem().residents.get(uin); return r ? clone(r) : null; },
    async putResident(r) { mem().residents.set(r.uin, clone(r)); },
    async listApps() { return clone([...mem().apps.values()]); },
    async getApp(ref) { const a = mem().apps.get(ref); return a ? clone(a) : null; },
    async putApp(a) { mem().apps.set(a.ref, clone(a)); },
    async getPayment(id) { const p = mem().payments.get(id); return p ? clone(p) : null; },
    async putPayment(p) { mem().payments.set(p.checkoutId, clone(p)); },
    async listEvents() { return clone(mem().events); },
    async addEvent(e) { mem().events.push(clone(e)); },
    async reset() { g.__tambuaMem = fresh(); },
  };
}
