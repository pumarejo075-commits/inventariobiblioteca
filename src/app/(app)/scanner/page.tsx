"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useSessionStore } from "@/hooks/use-session";
import { queueScan } from "@/lib/offline/db";
import { normalizeBarcodeKey } from "@/lib/utils";
import { DEFAULT_INVENTORY_SESSION_ID } from "@/lib/inventory-session";
import type { ScanProcessResult } from "@/types/database";

const BarcodeScanner = dynamic(
  () => import("@/components/scanner/barcode-scanner").then((m) => m.BarcodeScanner),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
        Iniciando cámara...
      </div>
    ),
  }
);

export default function ScannerPage() {
  const router = useRouter();
  const { activeSession } = useSessionStore();
  const sessionId = activeSession?.id ?? DEFAULT_INVENTORY_SESSION_ID;

  const handleScan = useCallback(
    async (barcode: string): Promise<ScanProcessResult> => {
      const code = normalizeBarcodeKey(barcode);
      if (!code) {
        return { result: "not_found", message: "Código vacío" };
      }

      if (!navigator.onLine) {
        await queueScan({
          sessionId,
          barcode: code,
          forceOverride: false,
        });
        return {
          result: "found",
          message: "Guardado offline — se sincronizará al reconectar",
        };
      }

      try {
        const res = await fetch("/api/scans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            barcode: code,
            forceOverride: false,
          }),
        });
        const data = await res.json();
        if (res.status === 401) {
          toast.error("Sesión expirada. Vuelve a iniciar sesión.");
          return { result: "not_found", message: "Sesión expirada" };
        }
        if (!res.ok) {
          return { result: "not_found", message: data.error ?? "Error de escaneo" };
        }
        return data as ScanProcessResult;
      } catch {
        await queueScan({
          sessionId,
          barcode: code,
          forceOverride: false,
        });
        return { result: "found", message: "Cola offline" };
      }
    },
    [sessionId]
  );

  return <BarcodeScanner onScan={handleScan} onClose={() => router.back()} />;
}
