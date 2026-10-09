import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/Badge";
import { IdCardPair } from "@/components/IdCard";
import { Timeline } from "@/components/Timeline";
import { store } from "@/lib/data/store";
import { fmtLongDay, fullName } from "@/lib/format";
import { qrSvg } from "@/lib/registry";
import { centreName } from "@/lib/rules";

export const dynamic = "force-dynamic";

export default async function TrackRef({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const s = await store();
  const a = await s.getApp(ref);
  if (!a) notFound();
  const r = (await s.getResident(a.uin))!;
  const rej = a.history.find((h) => h.s === "rejected");
  return (
    <div className="bg-paper">
      <div className="wrap max-w-4xl py-12">
        <Link href="/track" className="text-sm font-semibold text-ke-green">← Track another</Link>
        <div className="panel mt-4 space-y-8 p-6 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="mono text-sm text-muted">{a.ref}</p><h1 className="text-3xl font-extrabold">{fullName(r)}</h1><p className="text-muted">{a.type === "replacement" ? "Replacement ID card" : "First ID card"}</p></div>
            <StatusBadge status={a.status} app={a} />
          </div>
          {a.status === "identity" && a.identity.mode === "office" && <Box tone="amber" title="Your visit">{centreName(a.identity.centre)}, {fmtLongDay(a.identity.date!)} at {a.identity.time}. Bring your identity QR.</Box>}
          {a.status === "ready" && <Box tone="green" title={a.delivery.method === "courier" ? "Your card is on the way" : "Your card is ready"}>{a.delivery.method === "courier" ? `The courier will call ${a.phone} before arriving at ${a.delivery.address}. Have your QR ready; they scan it and take your fingerprints.` : `Collect it at ${centreName(a.delivery.centre)}, weekdays 08:00–17:00.`}</Box>}
          {rej && <Box tone="red" title="What to do next">{rej.note} You can start a new application with the same QR.</Box>}
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
            <Timeline app={a} />
            {a.card && <div className="space-y-3"><p className="eyebrow">Your card</p><IdCardPair r={r} card={a.card} photo={a.photo} qrSvg={await qrSvg(r.token)} /></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Box({ tone, title, children }: { tone: "amber" | "green" | "red"; title: string; children: React.ReactNode }) {
  const c = { amber: "border-amber bg-amber-soft", green: "border-ke-green bg-ke-green-soft", red: "border-ke-red bg-ke-red-soft" }[tone];
  return <div className={`rounded-xl border-l-4 p-4 ${c}`}><b className="block">{title}</b><span className="text-sm">{children}</span></div>;
}
