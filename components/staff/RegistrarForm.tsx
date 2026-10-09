"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { registrarRegister } from "@/app/actions";
import { COUNTIES } from "@/lib/rules";

export function RegistrarForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  return (
    <form className="space-y-3" onSubmit={(e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      const g = (k: string) => String(f.get(k) ?? "");
      start(async () => {
        setErr("");
        const res = await registrarRegister({ surname: g("surname"), given: g("given"), dob: g("dob"), sex: g("sex") === "M" ? "M" : "F", county: g("county"), mother: g("mother"), father: g("father") });
        if (!res.ok) setErr(res.error); else router.push(`/staff/people/${res.uin}`);
      });
    }}>
      <div className="grid grid-cols-2 gap-3">
        <label className="field" htmlFor="surname">Surname<input id="surname" name="surname" className="input" required /></label>
        <label className="field" htmlFor="given">Given names<input id="given" name="given" className="input" required /></label>
        <label className="field" htmlFor="dob">Date of birth<input id="dob" name="dob" type="date" className="input" required /></label>
        <label className="field" htmlFor="sex">Sex<select id="sex" name="sex" className="input"><option value="F">Female</option><option value="M">Male</option></select></label>
      </div>
      <label className="field" htmlFor="county">Place of birth<select id="county" name="county" className="input">{COUNTIES.map((c) => <option key={c}>{c}</option>)}</select></label>
      <label className="field" htmlFor="mother">Mother&apos;s full name<input id="mother" name="mother" className="input" required /></label>
      <label className="field" htmlFor="father">Father&apos;s full name <small>Optional</small><input id="father" name="father" className="input" /></label>
      {err && <p className="text-sm text-ke-red">{err}</p>}
      <button className="btn-green w-full" disabled={pending}>{pending ? "Registering…" : "Register birth and issue QR"}</button>
    </form>
  );
}
