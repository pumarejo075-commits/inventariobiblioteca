"use client";

import { getPendingScans, removePendingScan } from "./db";

export async function syncPendingScans(onProgress?: (remaining: number) => void) {
  const pending = await getPendingScans();
  let remaining = pending.length;

  for (const scan of pending.sort((a, b) => a.createdAt - b.createdAt)) {
    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: scan.sessionId,
          barcode: scan.barcode,
          forceOverride: scan.forceOverride,
        }),
      });
      if (res.ok) {
        await removePendingScan(scan.id);
        remaining--;
        onProgress?.(remaining);
      }
    } catch {
      /* keep in queue */
    }
  }

  return { synced: pending.length - remaining, remaining };
}

export function useOnlineSync() {
  if (typeof window === "undefined") return;

  const handleOnline = () => {
    syncPendingScans();
  };

  window.addEventListener("online", handleOnline);
  return () => window.removeEventListener("online", handleOnline);
}
