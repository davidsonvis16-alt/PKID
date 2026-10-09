import { signOut } from "@/app/actions";
import { ResetButton } from "@/components/staff/Buttons";
import { StaffNav } from "@/components/staff/StaffNav";
import { computeAlerts } from "@/lib/fraud";
import { snapshot } from "@/lib/registry";
import { isOpen } from "@/lib/rules";
import { requireStaff } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const { residents, apps, events, kind } = await snapshot();
  const alerts = computeAlerts(residents, apps, events);
  return (
    <div className="bg-paper">
      <div className="wrap grid gap-6 py-6 lg:grid-cols-[240px_1fr] lg:py-8">
        <aside className="min-w-0 space-y-5 self-start rounded-2xl bg-ke-black p-4 text-white lg:sticky lg:top-4">
          <div className="flex items-center justify-between gap-2 px-1">
            <div><p className="mono text-sm font-semibold">{staff.staffNo}</p><p className="text-xs capitalize text-white/55">{staff.role === "registrar" ? "Civil registrar" : "Registration officer"}</p></div>
            <form action={signOut}><button className="rounded-md border border-white/20 px-2 py-1 text-xs font-semibold hover:border-white/60">Sign out</button></form>
          </div>
          <div className="ribbon h-1 rounded" />
          <StaffNav counts={{ alerts: alerts.length, queue: apps.filter((a) => isOpen(a.status)).length }} />
          <div className="space-y-1 border-t border-white/10 px-1 pt-4 text-xs text-white/55">
            <p>Data: <span className="font-semibold text-white">{kind === "supabase" ? "Supabase" : "In-memory (resets on restart)"}</span></p>
            <ResetButton />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
