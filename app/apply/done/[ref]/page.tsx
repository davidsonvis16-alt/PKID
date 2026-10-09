import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/CopyButton";
import { IconCheck } from "@/components/Icons";
import { store } from "@/lib/data/store";
import { fmtLongDay } from "@/lib/format";
import { centreName } from "@/lib/rules";

export const dynamic = "force-dynamic";

export default async function Done({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const s = await store();
  const a = await s.getApp(ref);
  if (!a) notFound();
  const r = (await s.getResident(a.uin))!;
  return (
    <div className="bg-paper">
      <div className="wrap max-w-3xl py-14">
        <div className="panel overflow-hidden">
          <div className="ribbon h-2" />
          <div className="space-y-6 p-6 sm:p-10">
            <span className="grid size-14 place-items-center rounded-full bg-ke-green text-white"><IconCheck className="size-7" /></span>
            <div>
              <p className="eyebrow">Ombi limepokelewa · Application received</p>
              <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{r.given.split(" ")[0]}, your application is in</h1>
            </div>
            <div className="flex flex-wrap items-center gap-4 rounded-xl border-2 border-dashed border-ke-green bg-ke-green-soft px-5 py-4">
              <div><p className="eyebrow">Reference</p><p className="mono text-2xl font-semibold tracking-wide">{a.ref}</p></div>
              <CopyButton text={a.ref} label="Copy reference" />
            </div>
            <ul className="space-y-2 text-muted">
              <li>We sent an SMS to <b className="text-ink">{a.phone}</b> and will text you at every stage.</li>
              {a.identity.mode === "home"
                ? <li>An officer compares your selfie with your photo, usually within one working day.</li>
                : <li>Visit <b className="text-ink">{centreName(a.identity.centre)}</b> on <b className="text-ink">{fmtLongDay(a.identity.date!)} at {a.identity.time}</b> with your QR.</li>}
              {a.delivery.method === "courier"
                ? <li>Your card goes by courier to <b className="text-ink">{a.delivery.address}, {a.delivery.county}</b>. Fingerprints are taken at handover.</li>
                : <li>Collect your card at <b className="text-ink">{centreName(a.delivery.centre)}</b> when we text you.</li>}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link href={`/track/${a.ref}`} className="btn-green">Track this application</Link>
              <Link href="/" className="btn">Back to home</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
