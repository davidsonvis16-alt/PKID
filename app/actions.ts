"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { signSession, STAFF_COOKIE, type StaffRole } from "@/lib/crypto";
import { store } from "@/lib/data/store";
import * as reg from "@/lib/registry";
import { requireStaff } from "@/lib/session";

/* citizen */
export async function lookupApplicant(token: string) { return reg.applicantLookup(token); }
export async function payStart(phone: string, amount: number) { return reg.startPayment(phone, amount); }
export async function payPoll(id: string) { return reg.pollPayment(id); }
export async function payCancel(id: string) { return reg.cancelPayment(id); }
export async function submitApplication(input: reg.SubmitInput) {
  const res = await reg.submitApplication(input);
  if (res.ok) revalidatePath("/staff", "layout");
  return res;
}
export async function verifyPublic(token: string, verifier: string, purpose: string) { return reg.publicCheck(token, verifier, purpose); }
export async function walletOpen(token: string, dob: string) { return reg.openWallet(token, dob); }
export async function walletReportLost(token: string, dob: string) { return reg.reportLost(token, dob); }

/* staff */
export async function signIn(_: unknown, form: FormData) {
  const staffNo = String(form.get("staffNo") || "").trim().toUpperCase();
  const pin = String(form.get("pin") || "");
  const role = (form.get("role") === "registrar" ? "registrar" : "officer") as StaffRole;
  if (!/^[A-Z]{3}-\d{4}$/.test(staffNo)) return { error: "Staff numbers look like OFF-1042." };
  if (pin !== (process.env.STAFF_PIN || "2468")) return { error: "Wrong PIN. Check the STAFF_PIN in your .env.local." };
  (await cookies()).set(STAFF_COOKIE, signSession(role, staffNo), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 8 * 3600 });
  redirect("/staff");
}
export async function signOut() {
  (await cookies()).delete(STAFF_COOKIE);
  redirect("/signin");
}
export async function staffAdvance(ref: string) {
  const s = await requireStaff();
  const res = await reg.advanceApplication(ref, s.staffNo);
  revalidatePath("/staff", "layout");
  return res;
}
export async function staffReject(ref: string, reason: string) {
  const s = await requireStaff();
  const res = await reg.rejectApplication(ref, reason, s.staffNo);
  revalidatePath("/staff", "layout");
  return res;
}
export async function registrarRegister(input: reg.BirthInput) {
  await requireStaff();
  const res = await reg.registerBirth(input);
  revalidatePath("/staff", "layout");
  return res;
}
export async function registrarReissue(uin: string) {
  await requireStaff();
  const res = await reg.reissueQr(uin);
  revalidatePath("/staff", "layout");
  return res;
}
export async function resetDemo() {
  await requireStaff();
  await (await store()).reset();
  revalidatePath("/", "layout");
}
