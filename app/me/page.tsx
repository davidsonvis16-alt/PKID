import type { Metadata } from "next";
import { WalletPanel } from "@/components/WalletPanel";
import { snapshot } from "@/lib/registry";
import { ageOn, fullName } from "@/lib/format";

export const metadata: Metadata = { title: "My ID" };
export const dynamic = "force-dynamic";

export default async function Me() {
  const { residents } = await snapshot();
  const samples = residents.map((r) => ({ uin: r.uin, name: fullName(r), age: ageOn(r.dob), token: r.token, dob: r.dob }));
  return (
    <div className="bg-paper">
      <div className="wrap py-12 sm:py-14">
        <p className="eyebrow">Kitambulisho changu · My ID</p>
        <h1 className="mt-1 text-4xl font-extrabold sm:text-5xl">Your ID, and everyone who checked it</h1>
        <p className="mt-2 max-w-2xl text-muted">See every bank, employer or landlord that scanned your QR. Block a lost card in one tap.</p>
        <div className="mt-8"><WalletPanel samples={samples} /></div>
      </div>
    </div>
  );
}
