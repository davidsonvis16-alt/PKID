import type { Metadata } from "next";
import { ApplyWizard } from "@/components/ApplyWizard";
import { samplePeople } from "@/lib/samples";

export const metadata: Metadata = { title: "Apply for an ID" };
export const dynamic = "force-dynamic";

export default async function ApplyPage() {
  return (
    <div className="bg-paper">
      <div className="wrap py-10 sm:py-14">
        <p className="eyebrow">Omba kitambulisho · Apply</p>
        <h1 className="mt-1 text-4xl font-extrabold sm:text-5xl">Apply for your ID</h1>
        <p className="mt-2 max-w-2xl text-muted">About ten minutes on your phone. Have your identity QR, a passport photo and your M-Pesa line ready.</p>
        <div className="mt-8"><ApplyWizard samples={(await samplePeople()).filter((s) => !["Mercy Chebet ROTICH", "Abdi Noor ADAN", "Wanjiku Njeri KAMAU"].includes(s.name))} /></div>
      </div>
    </div>
  );
}
