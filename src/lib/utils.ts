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

export function playBeep(frequency = 880, duration = 0.08) {
  if (typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    gain.gain.value = 0.15;
    osc.start();
    osc.stop(ctx.currentTime + duration);
    setTimeout(() => ctx.close(), 200);
  } catch {
    /* audio optional */
  }
}

export function vibrate(pattern: number | number[] = 50) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}
