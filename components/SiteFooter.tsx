import Link from "next/link";
import { LogoMark } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-ke-black text-white/75">
      <div className="ribbon h-1.5" />
      <div className="wrap grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-white"><LogoMark className="size-9" /><span className="font-display text-xl font-bold">Tambua</span></div>
          <p className="max-w-xs text-sm">One signed QR from birth. No photocopies, no queues, no middlemen.</p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">For citizens</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/apply" className="hover:text-white">Apply for an ID</Link></li>
            <li><Link href="/track" className="hover:text-white">Track an application</Link></li>
            <li><Link href="/me" className="hover:text-white">My ID and who checked it</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">For organisations</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/verify" className="hover:text-white">Verify an identity QR</Link></li>
            <li><Link href="/#fraud" className="hover:text-white">How forgery is caught</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Staff</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/staff" className="hover:text-white">Registry dashboard</Link></li>
            <li><Link href="/staff/registrar" className="hover:text-white">Birth registration</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="wrap flex flex-wrap justify-between gap-2 py-5 text-xs text-white/50">
          <span>Concept prototype. Payments are simulated. People in the example data are fictional.</span>
          <span>Card MRZ follows ICAO 9303 TD1 with the specimen state code UTO.</span>
        </div>
      </div>
    </footer>
  );
}
