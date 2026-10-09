import Link from "next/link";
import { IdCardFront } from "@/components/IdCard";
import { IconAlert, IconArrow, IconCard, IconEye, IconQr, IconSearch, IconShield, IconTruck } from "@/components/Icons";
import { Photo } from "@/components/Photo";
import { CENTRES } from "@/lib/rules";
import { snapshot } from "@/lib/registry";

export const dynamic = "force-dynamic";

const SERVICES = [
  { href: "/apply", icon: IconCard, title: "Apply for your first ID", body: "Turned 18? Scan your QR, add a photo, pay by M-Pesa. Done from your phone.", tone: "green" },
  { href: "/apply", icon: IconQr, title: "Replace a lost ID", body: "Same QR, same ID number. Add a police abstract and we print a new card.", tone: "green" },
  { href: "/track", icon: IconSearch, title: "Track an application", body: "Use the reference from your SMS to see each stage as it happens.", tone: "green" },
  { href: "/verify", icon: IconShield, title: "Verify someone's ID", body: "For banks, SACCOs, employers and schools. Proof in seconds, not photocopies.", tone: "green" },
  { href: "/me", icon: IconEye, title: "See who checked your ID", body: "Every bank or employer that scans your QR shows up in your log.", tone: "green" },
  { href: "/me", icon: IconAlert, title: "Report a lost card", body: "Block it in one tap. Anyone who tries to use it gets flagged.", tone: "red" },
] as const;

const GONE = ["Birth certificate", "Parents' ID copies", "Chief's letter", "Age assessment", "School leaving certificate", "Sworn affidavit"];

const STEPS = [
  { k: "At birth", t: "Registrar issues your QR", b: "Signed by the registry and tied to a 12-digit identity number for life." },
  { k: "At 18", t: "Scan it and add a photo", b: "Your parents, birthplace and age come from the registry. Nothing to prove." },
  { k: "From home", t: "Live selfie, pay by M-Pesa", b: "A selfie replaces the office visit. If anything looks off, we ask you to come in." },
  { k: "At your door", t: "Courier delivers your card", b: "Fingerprints are captured on a handheld scanner when you receive it." },
];

const FAQ = [
  ["Where do I get my identity QR?", "It is printed on your birth registration slip. If you were born before the QR system, any registrar converts your birth record in one visit and gives you a QR."],
  ["What if I lose the QR?", "The QR is not a secret; it only proves who you are when the registry's signature checks out. If you lose the printout, a registrar reprints it and the old one stops working everywhere."],
  ["Can someone fake my QR?", "They can copy the picture, but changing any detail breaks the signature. Copies of an old QR get flagged too, and you see every check in your My ID log."],
  ["Do I ever need to visit an office?", "Only if your selfie doesn't match your photo, or if you prefer to. Otherwise your fingerprints are captured when the courier hands you the card."],
  ["How much does it cost?", "KES 300 for a first ID, KES 1,000 for a replacement, plus KES 200 if you want it delivered."],
];

export default async function Home() {
  const { residents, apps } = await snapshot();
  const showcase = apps.find((a) => a.card);
  const showR = showcase && residents.find((r) => r.uin === showcase.uin);
  const stats = { people: residents.length, cards: residents.filter((r) => r.idNo).length };

  return (
    <>
      {/* hero */}
      <section className="relative overflow-hidden bg-ke-black text-white">
        <div className="pointer-events-none absolute -left-40 top-10 size-[520px] rounded-full bg-ke-green/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 -top-24 size-[420px] rounded-full bg-ke-red/25 blur-3xl" />
        <div className="wrap relative grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div className="space-y-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
              <span className="size-2 rounded-full bg-ke-green-bright" /> Applications open · delivered countrywide
            </span>
            <h1 className="text-5xl font-extrabold leading-[0.95] sm:text-6xl lg:text-7xl">
              Kitambulisho chako.<br /><span className="text-ke-green-bright">Bila foleni.</span>
            </h1>
            <p className="max-w-xl text-lg text-white/75">Your ID, without the queue. One signed QR from birth replaces the birth certificate, the photocopies and the trip to the registration office.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/apply" className="btn-green px-6 py-3 text-base">Apply for your ID <IconArrow className="size-4" /></Link>
              <Link href="/track" className="btn border-white/25 bg-transparent px-6 py-3 text-base text-white hover:border-white">Track an application</Link>
            </div>
            <dl className="grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6">
              <div><dt className="text-xs text-white/55">Documents to photocopy</dt><dd className="font-display text-3xl font-bold">0</dd></div>
              <div><dt className="text-xs text-white/55">People in the registry</dt><dd className="font-display text-3xl font-bold">{stats.people}</dd></div>
              <div><dt className="text-xs text-white/55">Cards issued</dt><dd className="font-display text-3xl font-bold">{stats.cards}</dd></div>
            </dl>
          </div>
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            {showcase && showR && (
              <div className="rotate-[-4deg] transition hover:rotate-0">
                <IdCardFront r={showR} card={showcase.card!} photo={showcase.photo} />
              </div>
            )}
            <div className="absolute -bottom-6 -left-2 flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-ink shadow-xl sm:-left-8">
              <span className="grid size-9 place-items-center rounded-full bg-ke-green text-white"><IconShield className="size-5" /></span>
              <span className="text-sm"><b className="block">Signature valid</b><span className="text-muted">Checked against the registry</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* services */}
      <section className="wrap py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div><p className="eyebrow">Huduma · Services</p><h2 className="mt-1 text-3xl font-bold sm:text-4xl">What do you need to do?</h2></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <Link key={s.title} href={s.href} className="group panel relative flex flex-col gap-3 p-6 transition hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-lg">
              <span className={`grid size-11 place-items-center rounded-xl ${s.tone === "red" ? "bg-ke-red-soft text-ke-red" : "bg-ke-green-soft text-ke-green"}`}><s.icon className="size-6" /></span>
              <h3 className="text-lg font-bold">{s.title}</h3>
              <p className="text-sm text-muted">{s.body}</p>
              <span className={`mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold ${s.tone === "red" ? "text-ke-red" : "text-ke-green"}`}>Start <IconArrow className="size-4 transition group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
      </section>

      {/* what you need */}
      <section className="bg-paper">
        <div className="wrap grid gap-10 py-16 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="eyebrow">Unachohitaji · What you need</p>
            <h2 className="text-3xl font-bold sm:text-4xl">Three things. That&apos;s the list.</h2>
            <ul className="grid gap-3">
              {[["Your identity QR", "From your birth registration slip, or on your phone"], ["A passport photo", "Taken on your phone against a plain wall is fine"], ["An M-Pesa line", "For the fee and SMS updates"]].map(([t, b], i) => (
                <li key={t} className="flex gap-4 rounded-xl border border-line bg-white p-4">
                  <span className="mono grid size-8 shrink-0 place-items-center rounded-full bg-ke-black text-sm font-semibold text-white">{i + 1}</span>
                  <span><b className="block">{t}</b><span className="text-sm text-muted">{b}</span></span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <p className="eyebrow">Hazihitajiki tena · No longer needed</p>
            <h2 className="text-3xl font-bold sm:text-4xl">The QR already knows.</h2>
            <ul className="flex flex-wrap gap-2">
              {GONE.map((g) => (
                <li key={g} className="rounded-full border border-line bg-white px-4 py-2 text-sm text-muted line-through decoration-ke-red decoration-2">{g}</li>
              ))}
            </ul>
            <p className="max-w-lg text-sm text-muted">Each of these existed to prove your age, parents and birthplace. The registry recorded all three when you were born and signs them into your QR.</p>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="wrap py-16">
        <p className="eyebrow">Jinsi inavyofanya kazi · How it works</p>
        <h2 className="mt-1 text-3xl font-bold sm:text-4xl">From birth slip to card in your hand</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.t} className="relative border-t-4 pt-5" style={{ borderColor: ["#0a0a0a", "#c8102e", "#007a3d", "#00a651"][i] }}>
              <span className="mono text-xs font-semibold uppercase tracking-wider text-muted">{String(i + 1).padStart(2, "0")} · {s.k}</span>
              <h3 className="mt-2 text-lg font-bold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted">{s.b}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* fraud */}
      <section id="fraud" className="bg-ke-black text-white">
        <div className="wrap grid gap-10 py-16 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            <p className="eyebrow !text-white/50">Usalama · Built against fraud</p>
            <h2 className="text-3xl font-bold sm:text-4xl">A photocopy can be faked. A signature can&apos;t.</h2>
            <p className="text-white/70">Every scan is checked against the registry and logged. Patterns that point to forgery reach an officer the moment they happen.</p>
            <Link href="/staff" className="btn-green">Open the registry dashboard <IconArrow className="size-4" /></Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Forged QR", "Edit one digit and the signature fails. The attempt is logged against the identity it claimed.", "red"],
              ["Same face, two names", "Passport photos are fingerprinted. A face that appears under two identity numbers is flagged.", "red"],
              ["Double registration", "Same birth date and a near-identical name raises a duplicate alert before a card is printed.", "green"],
              ["Old or lost cards", "A replaced QR or a card reported lost gets flagged the moment someone presents it.", "green"],
            ].map(([t, b, c]) => (
              <div key={t} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <span className={`mb-3 block h-1 w-10 rounded ${c === "red" ? "bg-ke-red" : "bg-ke-green-bright"}`} />
                <h3 className="font-bold">{t}</h3>
                <p className="mt-1 text-sm text-white/65">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* offices */}
      <section className="wrap py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="eyebrow">Ofisi · Registration offices</p><h2 className="mt-1 text-3xl font-bold sm:text-4xl">Prefer to come in?</h2></div>
          <p className="flex items-center gap-2 text-sm text-muted"><IconTruck className="size-5 text-ke-green" /> Or skip the trip: we deliver to all counties.</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CENTRES.map((c) => (
            <div key={c.id} className="panel overflow-hidden">
              <Photo src={`/images/offices/${c.id}.jpg`} alt={`${c.name} registration office`} className="aspect-[16/9] w-full" label="Office photo" />
              <div className="p-4"><b>{c.name}</b><p className="text-sm text-muted">{c.addr} · Mon–Fri 08:00–17:00</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* faq */}
      <section className="bg-paper">
        <div className="wrap grid gap-10 py-16 lg:grid-cols-[1fr_2fr]">
          <div><p className="eyebrow">Maswali · Questions</p><h2 className="mt-1 text-3xl font-bold sm:text-4xl">Before you start</h2></div>
          <div className="divide-y divide-line rounded-2xl border border-line bg-white">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {q}<span className="grid size-7 shrink-0 place-items-center rounded-full border border-line text-lg leading-none transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-2xl text-sm text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
