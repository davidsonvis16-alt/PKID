"use client";
import { useActionState } from "react";
import { signIn } from "@/app/actions";

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, null);
  return (
    <form action={action} className="space-y-4">
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="mb-2 text-sm font-semibold">Role</legend>
        {[["officer", "Registration officer"], ["registrar", "Civil registrar"]].map(([v, l], i) => (
          <label key={v} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line p-3 text-sm font-semibold has-[:checked]:border-ke-green has-[:checked]:bg-ke-green-soft">
            <input type="radio" name="role" value={v} defaultChecked={i === 0} className="accent-ke-green" />{l}
          </label>
        ))}
      </fieldset>
      <label className="field" htmlFor="staffNo">Staff number<input id="staffNo" name="staffNo" className="input mono uppercase" defaultValue="OFF-1042" autoComplete="username" /></label>
      <label className="field" htmlFor="pin">PIN <small>Set as STAFF_PIN in .env.local (default 2468)</small><input id="pin" name="pin" type="password" inputMode="numeric" className="input mono" autoComplete="current-password" /></label>
      {state?.error && <p className="rounded-lg bg-ke-red-soft p-3 text-sm text-ke-red">{state.error}</p>}
      <button className="btn-green w-full py-3" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
