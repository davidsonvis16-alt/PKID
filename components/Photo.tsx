"use client";
import { useEffect, useRef, useState } from "react";

/** Real photo with a clear "add this file" state when the image hasn't been added yet. */
export function Photo({ src, alt, className = "", label }: { src: string | null; alt: string; className?: string; label?: string }) {
  const [broken, setBroken] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // An image that failed before hydration never fires onError, so check on mount too.
  useEffect(() => { const i = ref.current; if (i && i.complete && i.naturalWidth === 0) setBroken(true); }, [src]);
  if (!src || broken) {
    return (
      <div className={`grid place-items-center bg-paper p-2 text-center text-[0.68rem] leading-tight text-muted ${className}`} role="img" aria-label={alt}>
        <span>
          <span className="mono block font-semibold text-ink/70">{label ?? "No photo"}</span>
          {src && !src.startsWith("data:") && <span className="mono mt-1 block break-all opacity-70">public{src}</span>}
        </span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={src} alt={alt} onError={() => setBroken(true)} className={`object-cover ${className}`} />;
}
