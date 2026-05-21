import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeBarcode(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeBarcodeKey(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("es-MX").format(n);
}

export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

let audioCtx: AudioContext | null = null;

export function initAudioOnGesture() {
  if (typeof window === "undefined") return;
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === "suspended") void audioCtx.resume();
  } catch {
    /* audio optional */
  }
}

export function playBeep(frequency = 880, duration = 0.08) {
  if (typeof window === "undefined") return;
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = frequency;
    gain.gain.value = 0.15;
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    /* audio optional */
  }
}

export function vibrate(pattern: number | number[] = 50) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}
