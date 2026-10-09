export function LogoMark({ className = "size-10" }: { className?: string }) {
  // Original mark: a QR finder pattern inside a seal ring, split in the flag colours.
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="22.5" fill="#0a0a0a" stroke="#fff" strokeWidth="1.5" />
      <path d="M24 3.5a20.5 20.5 0 0 1 20.5 20.5H3.5A20.5 20.5 0 0 1 24 3.5Z" fill="#c8102e" opacity=".95" />
      <path d="M3.5 24h41A20.5 20.5 0 0 1 24 44.5 20.5 20.5 0 0 1 3.5 24Z" fill="#007a3d" />
      <rect x="3.5" y="22.6" width="41" height="2.8" fill="#fff" />
      <g fill="#fff"><rect x="14" y="12" width="8" height="8" rx="1.4" /><rect x="26" y="12" width="8" height="8" rx="1.4" /><rect x="14" y="28" width="8" height="8" rx="1.4" /><rect x="27" y="29" width="3" height="3" /><rect x="31" y="33" width="3" height="3" /></g>
      <g fill="#0a0a0a"><rect x="16.5" y="14.5" width="3" height="3" /><rect x="28.5" y="14.5" width="3" height="3" /><rect x="16.5" y="30.5" width="3" height="3" /></g>
    </svg>
  );
}
