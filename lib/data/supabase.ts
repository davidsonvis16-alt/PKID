import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Application, Payment, Resident, VerifyEvent } from "../types";
import { buildSeed } from "./seed";
import type { Store } from "./store";

// Each table stores one JSON document per row: (key text primary key, data jsonb). See supabase/schema.sql.
export async function supabaseStore(): Promise<Store> {
  const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

  const list = async <T,>(table: string): Promise<T[]> => {
    const { data, error } = await db.from(table).select("data");
    if (error) throw new Error(`${table}: ${error.message}`);
    return (data ?? []).map((row) => row.data as T);
  };
  const get = async <T,>(table: string, key: string): Promise<T | null> => {
    const { data, error } = await db.from(table).select("data").eq("key", key).maybeSingle();
    if (error) throw new Error(`${table}: ${error.message}`);
    return (data?.data as T) ?? null;
  };
  const put = async (table: string, key: string, value: unknown) => {
    const { error } = await db.from(table).upsert({ key, data: value, updated_at: new Date().toISOString() });
    if (error) throw new Error(`${table}: ${error.message}`);
  };
  const seedAll = async () => {
    const s = buildSeed();
    for (const r of s.residents) await put("residents", r.uin, r);
    for (const a of s.apps) await put("applications", a.ref, a);
    for (const e of s.events) await put("verify_events", e.id, e);
  };

  const { count, error } = await db.from("residents").select("key", { count: "exact", head: true });
  if (error) throw new Error(`Supabase is configured but the tables are missing. Run supabase/schema.sql. (${error.message})`);
  if (!count) await seedAll();

  return {
    kind: "supabase",
    listResidents: () => list<Resident>("residents"),
    getResident: (uin) => get<Resident>("residents", uin),
    putResident: (r) => put("residents", r.uin, r),
    listApps: () => list<Application>("applications"),
    getApp: (ref) => get<Application>("applications", ref),
    putApp: (a) => put("applications", a.ref, a),
    getPayment: (id) => get<Payment>("payments", id),
    putPayment: (p) => put("payments", p.checkoutId, p),
    listEvents: () => list<VerifyEvent>("verify_events"),
    addEvent: (e) => put("verify_events", e.id, e),
    async reset() {
      for (const t of ["residents", "applications", "payments", "verify_events"]) {
        const { error: e } = await db.from(t).delete().neq("key", "");
        if (e) throw new Error(`${t}: ${e.message}`);
      }
      await seedAll();
    },
  };
}
