import type { Metadata } from "next";
import { VerifyPanel } from "@/components/VerifyPanel";
import { samplePeople } from "@/lib/samples";

export const metadata: Metadata = { title: "Verify an ID" };
export const dynamic = "force-dynamic";

export default async function Verify() {
  return (
    <div className="bg-paper">
      <div className="wrap py-12 sm:py-14">
        <p className="eyebrow">Thibitisha · For banks, employers, schools, landlords</p>
        <h1 className="mt-1 text-4xl font-extrabold sm:text-5xl">Verify an identity QR</h1>
        <p className="mt-2 max-w-2xl text-muted">Stop collecting ID photocopies. Scan the QR on someone&apos;s card or phone and the registry tells you if it&apos;s real, in about a second.</p>
        <div className="mt-8"><VerifyPanel samples={await samplePeople()} /></div>
      </div>
    </div>
  );
}
