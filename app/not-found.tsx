import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap max-w-xl py-24 text-center">
      <p className="mono text-sm text-muted">404</p>
      <h1 className="mt-2 text-4xl font-extrabold">We couldn&apos;t find that</h1>
      <p className="mt-2 text-muted">Check the reference or link. Application references look like TMB-2026-481207.</p>
      <div className="mt-6 flex justify-center gap-3"><Link href="/track" className="btn-green">Track an application</Link><Link href="/" className="btn">Home</Link></div>
    </div>
  );
}
