export type Sex = "F" | "M";

export type Resident = {
  uin: string; // 12 digits, last is a Luhn check digit
  surname: string;
  given: string;
  dob: string; // YYYY-MM-DD
  sex: Sex;
  county: string;
  mother: string;
  father: string | null;
  registeredAt: string;
  token: string; // current signed identity QR
  tokenIat: number;
  qrIssuedAt: string;
  qrVersion: number;
  idNo: string | null;
  idStatus: "Active" | "Reported lost" | "Printing" | "Out for delivery" | "Ready to collect" | null;
  photo: string | null; // public path or data URL of the latest approved photo
  photoHash: string | null; // 64-bit average hash, hex
  phone: string | null;
};

export type AppStatus = "submitted" | "review" | "identity" | "printing" | "ready" | "collected" | "rejected";
export type AppType = "first" | "replacement";
export type IdentityMode = "home" | "office";

export type UploadedDoc = { name: string; size: number; type: string; thumb: string | null };
export type Card = { idNo: string; serial: string; issued: string; expiry: string };
export type HistoryEntry = { s: AppStatus; at: string; note?: string; by?: string };

export type Application = {
  ref: string;
  uin: string;
  type: AppType;
  photo: string | null;
  photoHash: string | null;
  docs: { loss?: UploadedDoc; address?: UploadedDoc };
  identity: {
    mode: IdentityMode;
    selfie: string | null; // live capture, home mode
    match: number | null; // 0..1 similarity between selfie and passport photo
    centre: string | null; // office mode
    date: string | null;
    time: string | null;
  };
  delivery: { method: "courier"; county: string; address: string } | { method: "collect"; centre: string };
  phone: string;
  payment: { receipt: string; amount: number; at: string; checkoutId: string };
  status: AppStatus;
  history: HistoryEntry[];
  card: Card | null;
  example: boolean;
  createdAt: string;
};

export type Payment = {
  checkoutId: string;
  phone: string;
  amount: number;
  createdAt: string;
  status: "pending" | "paid" | "cancelled";
  receipt: string | null;
  usedBy: string | null;
};

export type VerifyOutcome = "valid" | "forged" | "superseded" | "unknown" | "lost" | "malformed" | "underage";

export type VerifyEvent = {
  id: string;
  at: string;
  uin: string | null; // resolved or claimed identity number
  verifier: string;
  purpose: string;
  channel: "public" | "apply" | "wallet" | "staff";
  outcome: VerifyOutcome;
  example?: boolean;
};

export type Alert = {
  id: string;
  severity: "high" | "medium";
  kind: "photo-duplicate" | "name-duplicate" | "shared-phone" | "forged-qr" | "old-qr" | "lost-card" | "selfie-mismatch" | "underage";
  title: string;
  detail: string;
  uins: string[];
  refs: string[];
  at: string;
};

export type VerifyResult =
  | { ok: true; resident: Resident }
  | { ok: false; reason: string; outcome: VerifyOutcome; resident?: Resident };
