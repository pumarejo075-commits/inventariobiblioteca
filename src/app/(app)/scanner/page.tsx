"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useSessionStore } from "@/hooks/use-session";
import { queueScan } from "@/lib/offline/db";
import { normalizeBarcodeKey } from "@/lib/utils";
import type { ScanProcessResult } from "@/types/database";
const BarcodeScanner = dynamic(
  () => import("@/components/scanner/barcode-scanner").then((m) => m.BarcodeScanner),
  { ssr: false, loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
      Iniciando cámara...
    </div>
  )}
);

export default function ScannerPage() {
  const router = useRouter();
  const { activeSession } = useSessionStore();

  const handleScan = useCallback(
    async (barcode: string): Promise<ScanProcessResult> => {
      const code = normalizeBarcodeKey(barcode);
      if (!code) {
        return { result: "not_found", message: "Código vacío" };
      }
      if (!activeSession) {
        toast.error("Selecciona una sesión de inventario primero");
        return { result: "not_found", message: "Sin sesión activa" };
      }

      if (!navigator.onLine) {
        await queueScan({
          sessionId: activeSession.id,
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
            sessionId: activeSession.id,
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
          sessionId: activeSession.id,
          barcode: code,
          forceOverride: false,
        });
        return { result: "found", message: "Cola offline" };
      }
    },
    [activeSession]
  );

  if (!activeSession) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[var(--surface)] p-6 text-center">
        <p className="text-xl font-bold text-[var(--foreground)]">Sesión requerida</p>
        <button
          type="button"
          className="rounded-xl bg-[var(--success)] px-8 py-4 font-bold text-white"
          onClick={() => router.push("/sessions")}
        >
          Ir a sesiones
        </button>
      </div>
    );
  }

  return (
    <BarcodeScanner
      onScan={handleScan}
      onClose={() => router.back()}
    />
  );
}
