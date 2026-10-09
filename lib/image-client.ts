"use client";
import jsQR from "jsqr";

export function loadImage(src: Blob | string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const url = typeof src === "string" ? src : URL.createObjectURL(src);
    const img = new Image();
    img.onload = () => { if (typeof src !== "string") URL.revokeObjectURL(url); res(img); };
    img.onerror = () => { if (typeof src !== "string") URL.revokeObjectURL(url); rej(new Error("That file is not an image we can read. Use a JPG or PNG.")); };
    img.src = url;
  });
}

type Source = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;
const dims = (s: Source) => s instanceof HTMLVideoElement ? [s.videoWidth, s.videoHeight] : s instanceof HTMLImageElement ? [s.naturalWidth, s.naturalHeight] : [s.width, s.height];

/** Crop to fill tw×th (cover) or fit inside it, returned as a JPEG data URL. */
export function drawTo(src: Source, tw: number, th: number, cover: boolean, mirror = false) {
  let [sw, sh] = dims(src);
  let sx = 0, sy = 0, w: number, h: number;
  if (cover) {
    const r = tw / th;
    if (sw / sh > r) { const nw = sh * r; sx = (sw - nw) / 2; sw = nw; } else { const nh = sw / r; sy = (sh - nh) / 2; sh = nh; }
    w = tw; h = th;
  } else { const k = Math.min(1, tw / sw, th / sh); w = Math.round(sw * k); h = Math.round(sh * k); }
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const x = cv.getContext("2d")!;
  x.fillStyle = "#fff"; x.fillRect(0, 0, w, h);
  if (mirror) { x.translate(w, 0); x.scale(-1, 1); }
  x.drawImage(src, sx, sy, sw, sh, 0, 0, w, h);
  return cv;
}

export const toJpeg = (cv: HTMLCanvasElement, q = 0.82) => cv.toDataURL("image/jpeg", q);

/** 64-bit average hash (8×8 grayscale vs mean). Near-identical photos give near-identical hashes. */
export async function aHash(src: string | HTMLCanvasElement) {
  const img = typeof src === "string" ? await loadImage(src) : src;
  const cv = drawTo(img, 8, 8, true);
  const d = cv.getContext("2d")!.getImageData(0, 0, 8, 8).data;
  const g: number[] = [];
  for (let i = 0; i < 64; i++) g.push(0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]);
  const mean = g.reduce((a, b) => a + b, 0) / 64;
  let hex = "";
  for (let i = 0; i < 64; i += 4) hex += ((g[i] > mean ? 8 : 0) | (g[i + 1] > mean ? 4 : 0) | (g[i + 2] > mean ? 2 : 0) | (g[i + 3] > mean ? 1 : 0)).toString(16);
  return hex;
}

export function hashSimilarity(a: string, b: string) {
  let d = 0;
  for (let i = 0; i < 16; i++) { let x = parseInt(a[i], 16) ^ parseInt(b[i], 16); while (x) { d += x & 1; x >>= 1; } }
  return 1 - d / 64;
}

export function decodeQr(src: Source): string | null {
  const [w0, h0] = dims(src);
  if (!w0 || !h0) return null;
  const k = Math.min(1, 1200 / Math.max(w0, h0));
  const cv = drawTo(src, Math.round(w0 * k), Math.round(h0 * k), false);
  const data = cv.getContext("2d")!.getImageData(0, 0, cv.width, cv.height);
  return jsQR(data.data, cv.width, cv.height, { inversionAttempts: "attemptBoth" })?.data ?? null;
}

export async function readQrFile(file: Blob) {
  const img = await loadImage(file);
  const res = decodeQr(img);
  if (!res) throw new Error("No QR code found in that image. Crop closer to the code and make sure it's in focus.");
  return res;
}
