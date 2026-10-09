import { fmtDate } from "@/lib/format";
import { mrz } from "@/lib/mrz";
import type { Card, Resident } from "@/lib/types";
import { Photo } from "./Photo";

type R = Pick<Resident, "uin" | "surname" | "given" | "sex" | "dob" | "county">;

export function IdCardFront({ r, card, photo }: { r: R; card: Card; photo: string | null }) {
  return (
    <div className="idcard" aria-label="Front of identity card">
      <div className="ic-top"><b>KITAMBULISHO · IDENTITY CARD</b><span>SPECIMEN</span></div>
      <div className="ic-rib ribbon" />
      <div className="ic-front">
        <div className="ic-pic"><Photo src={photo} alt={`Card photo of ${r.given} ${r.surname}`} className="h-full w-full" label="PHOTO" /></div>
        <dl>
          <div className="full"><dt>Surname</dt><dd>{r.surname}</dd></div>
          <div className="full"><dt>Given names</dt><dd>{r.given.toUpperCase()}</dd></div>
          <div><dt>Sex</dt><dd>{r.sex}</dd></div>
          <div><dt>Date of birth</dt><dd>{fmtDate(r.dob).toUpperCase()}</dd></div>
          <div className="full ic-idno"><dt>ID number</dt><dd>{card.idNo}</dd></div>
          <div><dt>Issued</dt><dd>{fmtDate(card.issued)}</dd></div>
          <div><dt>Expires</dt><dd>{fmtDate(card.expiry)}</dd></div>
        </dl>
      </div>
      <span className="ic-spec">SPECIMEN</span>
    </div>
  );
}

export function IdCardBack({ r, card, qrSvg }: { r: Resident; card: Card; qrSvg: string }) {
  return (
    <div className="idcard" aria-label="Back of identity card">
      <div className="ic-back">
        <div className="ic-back-top">
          <p><b>{r.county} County</b>Place of birth<br />Serial {card.serial}<br />Scan the QR to confirm this card with the registry. A photocopy proves nothing; the signature does.</p>
          <div className="ic-qr" dangerouslySetInnerHTML={{ __html: qrSvg }} />
        </div>
        <div className="ic-mrz" aria-label="Machine readable zone">{mrz(r, card).join("\n")}</div>
      </div>
    </div>
  );
}

export function IdCardPair({ r, card, photo, qrSvg, row = false }: { r: Resident; card: Card; photo: string | null; qrSvg: string; row?: boolean }) {
  return (
    <div className={`grid gap-4 ${row ? "md:grid-cols-2" : "max-w-md"}`}>
      <IdCardFront r={r} card={card} photo={photo} />
      <IdCardBack r={r} card={card} qrSvg={qrSvg} />
    </div>
  );
}
