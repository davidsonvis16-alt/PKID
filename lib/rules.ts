import type { AppStatus, AppType, Application } from "./types";

export const CENTRES = [
  { id: "nbo", name: "Nairobi CBD", addr: "City Hall Way, Nairobi" },
  { id: "msa", name: "Mombasa", addr: "Nkrumah Road, Mombasa" },
  { id: "ksm", name: "Kisumu", addr: "Oginga Odinga Street, Kisumu" },
  { id: "eld", name: "Eldoret", addr: "Uganda Road, Eldoret" },
  { id: "nks", name: "Nakuru", addr: "Kenyatta Avenue, Nakuru" },
  { id: "mks", name: "Machakos", addr: "Mwatu wa Ngoma Road, Machakos" },
] as const;

export const COUNTIES = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Uasin Gishu", "Machakos", "Kiambu", "Kakamega", "Meru", "Nyeri", "Kilifi", "Garissa", "Kisii", "Turkana", "Bungoma", "Kajiado", "Kericho", "Embu"];

export const TIMES = ["08:30", "10:00", "11:30", "14:00", "15:30"];

export const FEES: Record<AppType, number> = { first: 300, replacement: 1000 };
export const COURIER_FEE = 200;

export const FLOW: AppStatus[] = ["submitted", "review", "identity", "printing", "ready", "collected"];

const courier = (a?: Pick<Application, "delivery">) => a?.delivery.method === "courier";
const home = (a?: Pick<Application, "identity">) => a?.identity.mode === "home";

type AppLike = Pick<Application, "delivery" | "identity">;
export function statusLabel(s: AppStatus, a?: AppLike): string {
  switch (s) {
    case "submitted": return "Submitted";
    case "review": return "Under review";
    case "identity": return home(a) ? "Identity check" : "Awaiting biometrics";
    case "printing": return "Printing";
    case "ready": return courier(a) ? "Out for delivery" : "Ready to collect";
    case "collected": return courier(a) ? "Delivered" : "Collected";
    case "rejected": return "Rejected";
  }
}
export function statusNote(s: AppStatus, a?: AppLike): string {
  switch (s) {
    case "submitted": return "Waiting for an officer to pick it up";
    case "review": return "An officer is checking your QR record and documents";
    case "identity": return home(a) ? "An officer is comparing your live selfie with your passport photo" : "Visit your office on the booked day for fingerprints and a live photo";
    case "printing": return "Approved. Your card is being printed";
    case "ready": return courier(a) ? "The courier will call you, then take your fingerprints at handover" : "Collect at your office. Bring your identity QR";
    case "collected": return courier(a) ? "Card delivered and fingerprints captured" : "Card handed over";
    case "rejected": return "";
  }
}
export const statusTone = (s: AppStatus): "info" | "warn" | "ok" | "bad" =>
  s === "rejected" ? "bad" : s === "ready" || s === "collected" ? "ok" : s === "identity" ? "warn" : "info";

export function nextAction(s: AppStatus, a: AppLike): string | null {
  switch (s) {
    case "submitted": return "Start review";
    case "review": return "Approve documents";
    case "identity": return home(a) ? "Identity confirmed, send to print" : "Biometrics captured, send to print";
    case "printing": return courier(a) ? "Card printed, hand to courier" : "Card printed";
    case "ready": return courier(a) ? "Mark delivered" : "Hand over card";
    default: return null;
  }
}

export const REJECT_REASONS = [
  "Photo does not meet the requirements. Upload a new passport photo.",
  "Live selfie does not match the passport photo.",
  "Police abstract is unreadable. Upload a clearer copy.",
  "Applicant did not attend the biometrics visit.",
  "Possible duplicate identity. Visit a registration office with your parents.",
];

export const isOpen = (s: AppStatus) => s !== "rejected" && s !== "collected";
export const centreName = (id: string | null) => {
  const c = CENTRES.find((x) => x.id === id);
  return c ? `${c.name} Registration Office` : "";
};
export const phoneOk = (p: string) => /^(?:\+?254|0)(7|1)\d{8}$/.test(p.replace(/\s+/g, ""));
export const normPhone = (p: string) => { const d = p.replace(/\D/g, ""); return d.startsWith("254") ? "0" + d.slice(3) : d; };
export const prettyPhone = (p: string) => normPhone(p).replace(/^(\d{4})(\d{3})(\d{3})$/, "$1 $2 $3");
