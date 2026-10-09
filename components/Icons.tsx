type P = { className?: string };
const base = (d: React.ReactNode, className = "size-5") => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{d}</svg>
);
export const IconQr = ({ className }: P) => base(<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v.01M17 21h4v-4M14 18v3" /></>, className);
export const IconCard = ({ className }: P) => base(<><rect x="2.5" y="5" width="19" height="14" rx="2" /><circle cx="8" cy="11" r="2" /><path d="M5.5 16c.6-1.4 1.5-2 2.5-2s1.9.6 2.5 2M13.5 10h5M13.5 13h3.5" /></>, className);
export const IconSearch = ({ className }: P) => base(<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.8-3.8" /></>, className);
export const IconShield = ({ className }: P) => base(<><path d="M12 3 4.5 6v5.5c0 4.6 3.1 8 7.5 9.5 4.4-1.5 7.5-4.9 7.5-9.5V6L12 3Z" /><path d="m8.8 12 2.2 2.2 4.3-4.4" /></>, className);
export const IconEye = ({ className }: P) => base(<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></>, className);
export const IconAlert = ({ className }: P) => base(<><path d="M12 3.5 2.5 20h19L12 3.5Z" /><path d="M12 10v4.5M12 17.2v.1" /></>, className);
export const IconTruck = ({ className }: P) => base(<><path d="M2.5 6.5h11v9h-11zM13.5 10h4l3 3v2.5h-7" /><circle cx="6.5" cy="17.5" r="1.7" /><circle cx="17" cy="17.5" r="1.7" /></>, className);
export const IconCamera = ({ className }: P) => base(<><path d="M4 7.5h3L8.5 5h7L17 7.5h3a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8.5a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13" r="3.5" /></>, className);
export const IconUpload = ({ className }: P) => base(<><path d="M12 16V4M7 8.5 12 4l5 4.5" /><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" /></>, className);
export const IconCheck = ({ className }: P) => base(<path d="m5 12.5 4.5 4.5L19 7.5" />, className);
export const IconX = ({ className }: P) => base(<path d="M6 6l12 12M18 6 6 18" />, className);
export const IconUsers = ({ className }: P) => base(<><circle cx="9" cy="8.5" r="3.2" /><path d="M3 19c.8-3 3.2-4.7 6-4.7s5.2 1.7 6 4.7" /><path d="M15.5 5.5a3 3 0 0 1 0 6M17.5 14.6c1.8.6 3 2.1 3.5 4.4" /></>, className);
export const IconInbox = ({ className }: P) => base(<><path d="M3 13.5 5.5 5h13l2.5 8.5V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5.5Z" /><path d="M3 13.5h5l1.5 2.5h5l1.5-2.5h5" /></>, className);
export const IconGrid = ({ className }: P) => base(<><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>, className);
export const IconBaby = ({ className }: P) => base(<><circle cx="12" cy="8" r="4" /><path d="M10.5 8h.01M13.5 8h.01M10.8 10c.7.5 1.7.5 2.4 0M6 20c.8-3.2 3.2-5.5 6-5.5s5.2 2.3 6 5.5" /></>, className);
export const IconArrow = ({ className }: P) => base(<path d="M5 12h14M13 6l6 6-6 6" />, className);
export const IconLock = ({ className }: P) => base(<><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>, className);
