import "server-only";
import type { Application, Payment, Resident, VerifyEvent } from "../types";

export interface Store {
  kind: "memory" | "supabase";
  listResidents(): Promise<Resident[]>;
  getResident(uin: string): Promise<Resident | null>;
  putResident(r: Resident): Promise<void>;
  listApps(): Promise<Application[]>;
  getApp(ref: string): Promise<Application | null>;
  putApp(a: Application): Promise<void>;
  getPayment(id: string): Promise<Payment | null>;
  putPayment(p: Payment): Promise<void>;
  listEvents(): Promise<VerifyEvent[]>;
  addEvent(e: VerifyEvent): Promise<void>;
  reset(): Promise<void>;
}

let cached: Store | null = null;

export async function store(): Promise<Store> {
  if (cached) return cached;
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { supabaseStore } = await import("./supabase");
    cached = await supabaseStore();
  } else {
    const { memoryStore } = await import("./memory");
    cached = memoryStore();
  }
  return cached;
}
