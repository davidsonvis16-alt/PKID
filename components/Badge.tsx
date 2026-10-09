import { statusLabel, statusTone } from "@/lib/rules";
import type { Application, AppStatus } from "@/lib/types";

const TONES = {
  ok: "bg-ke-green-soft text-ke-green",
  warn: "bg-amber-soft text-amber",
  bad: "bg-ke-red-soft text-ke-red",
  info: "bg-sky-soft text-sky",
  mute: "bg-paper text-muted",
} as const;

export function Badge({ tone, children }: { tone: keyof typeof TONES; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function StatusBadge({ status, app }: { status: AppStatus; app?: Pick<Application, "delivery" | "identity"> }) {
  return <Badge tone={statusTone(status)}>{statusLabel(status, app)}</Badge>;
}

export function IdStatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge tone="mute">No ID yet</Badge>;
  const tone = status === "Active" ? "ok" : status === "Reported lost" ? "bad" : "info";
  return <Badge tone={tone}>{status}</Badge>;
}
