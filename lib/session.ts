import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSession, STAFF_COOKIE } from "./crypto";

export async function getStaff() {
  return readSession((await cookies()).get(STAFF_COOKIE)?.value);
}
export async function requireStaff() {
  const s = await getStaff();
  if (!s) redirect("/signin");
  return s;
}
