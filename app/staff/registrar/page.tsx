import type { Metadata } from "next";
import Link from "next/link";
import { ReissueButton } from "@/components/staff/Buttons";
import { RegistrarForm } from "@/components/staff/RegistrarForm";
import { fmtDate, fmtUIN, fullName } from "@/lib/format";
import { snapshot } from "@/lib/registry";

export const metadata: Metadata = { title: "Birth registration" };

export default async function Registrar() {
  const { residents } = await snapshot();
  const recent = [...residents].sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
  return (
    <div className="space-y-5">
      <div><p className="eyebrow">Usajili wa kuzaliwa · Civil registration</p><h1 className="text-3xl font-extrabold">Register a birth and issue a QR</h1><p className="max-w-2xl text-sm text-muted">This is where a person&apos;s identity QR is created, once. Parents and place of birth are recorded here, so nobody ever has to prove them again.</p></div>
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <section className="panel overflow-hidden self-start"><div className="ribbon h-1.5" /><div className="p-5"><RegistrarForm /></div></section>
        <section className="panel overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-paper text-left text-xs uppercase tracking-wider text-muted"><tr><th className="px-4 py-3">Name</th><th className="px-3 py-3">Identity number</th><th className="px-3 py-3">Born</th><th className="px-3 py-3">QR</th><th className="px-4 py-3" /></tr></thead>
            <tbody className="divide-y divide-line">
              {recent.map((r) => (
                <tr key={r.uin}>
                  <td className="px-4 py-3"><Link href={`/staff/people/${r.uin}`} className="font-semibold hover:text-ke-green">{fullName(r)}</Link></td>
                  <td className="mono px-3 py-3">{fmtUIN(r.uin)}</td>
                  <td className="px-3 py-3">{fmtDate(r.dob)}</td>
                  <td className="px-3 py-3">v{r.qrVersion} · {fmtDate(r.qrIssuedAt)}</td>
                  <td className="px-4 py-3 text-right"><ReissueButton uin={r.uin} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
