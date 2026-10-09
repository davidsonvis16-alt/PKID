import { fmtDateTime } from "@/lib/format";
import { FLOW, statusLabel, statusNote } from "@/lib/rules";
import type { Application } from "@/lib/types";

export function Timeline({ app, staff = false }: { app: Application; staff?: boolean }) {
  const hist = new Map(app.history.map((h) => [h.s, h]));
  const Row = ({ state, title, sub }: { state: "done" | "cur" | "todo" | "bad"; title: string; sub: string }) => (
    <li className="relative grid grid-cols-[24px_1fr] gap-3 pb-5 last:pb-0 before:absolute before:left-[11px] before:top-6 before:bottom-0 before:w-0.5 before:bg-line last:before:hidden">
      <span className={`mt-0.5 grid size-6 place-items-center rounded-full border-2 ${state === "done" ? "border-ke-green bg-ke-green text-white" : state === "cur" ? "border-ke-green bg-white shadow-[0_0_0_4px_var(--color-ke-green-soft)]" : state === "bad" ? "border-ke-red bg-ke-red text-white" : "border-line bg-white"}`}>
        {state === "done" && <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={3}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>}
        {state === "bad" && <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={3}><path d="M6 6l12 12M18 6 6 18" /></svg>}
      </span>
      <div><b className="block text-[0.95rem]">{title}</b><span className="text-[0.84rem] text-muted">{sub}</span></div>
    </li>
  );

  if (app.status === "rejected") {
    const rej = hist.get("rejected")!;
    return (
      <ol>
        {app.history.filter((h) => h.s !== "rejected").map((h) => <Row key={h.s} state="done" title={statusLabel(h.s, app)} sub={`${fmtDateTime(h.at)}${h.note ? " · " + h.note : ""}${staff && h.by ? " · " + h.by : ""}`} />)}
        <Row state="bad" title="Rejected" sub={`${fmtDateTime(rej.at)} · ${rej.note ?? ""}`} />
      </ol>
    );
  }
  const ci = FLOW.indexOf(app.status);
  return (
    <ol>
      {FLOW.map((s, i) => {
        const h = hist.get(s);
        const state = i < ci || (i === ci && s === "collected") ? "done" : i === ci ? "cur" : "todo";
        const sub = h
          ? `${fmtDateTime(h.at)}${h.note ? " · " + h.note : ""}${staff && h.by ? " · " + h.by : ""}${i === ci && s !== "collected" ? " · " + statusNote(s, app) : ""}`
          : i === ci + 1 ? "Next" : "Pending";
        return <Row key={s} state={state} title={statusLabel(s, app)} sub={sub} />;
      })}
    </ol>
  );
}
