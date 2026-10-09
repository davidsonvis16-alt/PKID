import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/Logo";
import { SignInForm } from "@/components/staff/SignInForm";
import { getStaff } from "@/lib/session";

export const metadata: Metadata = { title: "Staff sign-in" };

export default async function SignIn() {
  if (await getStaff()) redirect("/staff");
  return (
    <div className="bg-paper">
      <div className="wrap grid max-w-5xl items-center gap-10 py-16 lg:grid-cols-2">
        <div className="space-y-4">
          <LogoMark className="size-14" />
          <h1 className="text-4xl font-extrabold">Staff portal</h1>
          <p className="text-muted">For registration officers and civil registrars. Every action you take is recorded against your staff number.</p>
          <ul className="space-y-2 text-sm text-muted">
            <li>· Registry dashboard with live fraud alerts</li><li>· Everyone in the registry, with lookalike search</li><li>· Application queue and card printing</li><li>· Birth registration and QR reissue</li>
          </ul>
        </div>
        <div className="panel overflow-hidden"><div className="ribbon h-1.5" /><div className="p-6 sm:p-8"><SignInForm /></div></div>
      </div>
    </div>
  );
}
