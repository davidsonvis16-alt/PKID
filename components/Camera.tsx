"use client";
import { useEffect, useRef, useState } from "react";

/** Live camera with start/stop handled for you. `onFrame` runs ~4 times a second while open. */
export function Camera({ facing, onFrame, overlay, mirror = false, className = "" }: {
  facing: "user" | "environment";
  onFrame?: (v: HTMLVideoElement) => boolean | void; // return true to stop
  overlay?: React.ReactNode;
  mirror?: boolean;
  className?: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState("");
  const frame = useRef(onFrame);
  frame.current = onFrame;

  useEffect(() => {
    let stream: MediaStream | null = null, timer = 0, stopped = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 } }, audio: false });
        if (stopped) return stream.getTracks().forEach((t) => t.stop());
        const v = video.current!;
        v.srcObject = stream;
        await v.play();
        timer = window.setInterval(() => { if (v.readyState >= 2 && frame.current?.(v)) window.clearInterval(timer); }, 250);
      } catch (e) {
        const name = (e as Error).name;
        setErr(name === "NotAllowedError" ? "Camera access was blocked. Allow it in your browser's address bar, or upload a photo instead." : "No camera found on this device. Upload a photo instead.");
      }
    })();
    return () => { stopped = true; window.clearInterval(timer); stream?.getTracks().forEach((t) => t.stop()); };
  }, [facing]);

  if (err) return <div className="rounded-xl bg-amber-soft p-4 text-sm text-amber">{err}</div>;
  return (
    <div className={`relative overflow-hidden rounded-xl bg-ke-black ${className}`}>
      <video ref={video} playsInline muted className={`h-full w-full object-cover ${mirror ? "-scale-x-100" : ""}`} />
      {overlay}
    </div>
  );
}
