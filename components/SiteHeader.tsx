import Link from "next/link";
import { LogoMark } from "./Logo";
import { NavLinks } from "./NavLinks";

export function SiteHeader() {
  return (
    <header className="bg-ke-black text-white">
      <div className="border-b border-white/10 text-[0.75rem] text-white/70">
        <div className="wrap flex flex-wrap items-center justify-between gap-2 py-1.5">
          <span>Concept prototype of a national ID service. Not an official government website.</span>
          <span className="hidden sm:inline">Msaada · Help line <span className="mono text-white">0800 000 000</span></span>
        </div>
      </div>
      <div className="wrap flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark className="size-11" />
          <span className="leading-tight">
            <span className="block font-display text-[1.6rem] font-extrabold tracking-tight">Tambua</span>
            <span className="block text-[0.78rem] text-white/65">National Identity Service</span>
          </span>
        </Link>
        <NavLinks />
      </div>
      <div className="ribbon h-1.5" />
    </header>
  );
}
