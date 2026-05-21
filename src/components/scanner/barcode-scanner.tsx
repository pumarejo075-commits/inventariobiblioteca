"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, DecodeHintType } from "@zxing/library";
import { motion, AnimatePresence } from "framer-motion";
import { Flashlight, FlashlightOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, playBeep, vibrate } from "@/lib/utils";
import type { ScanProcessResult, ScanResult } from "@/types/database";

interface BarcodeScannerProps {
  onScan: (barcode: string) => Promise<ScanProcessResult>;
  onClose?: () => void;
  disabled?: boolean;
}

type OverlayState = ScanResult | "not_found" | null;

const OVERLAY_CONFIG: Record<
  string,
  { bg: string; label: string; sub: string }
> = {
  found: {
    bg: "bg-emerald-500",
    label: "ENCONTRADO",
    sub: "Activo registrado correctamente",
  },
  group_reconciled: {
    bg: "bg-emerald-500",
    label: "PAQUETE",
    sub: "Grupo reconciliado automáticamente",
  },
  duplicate: {
    bg: "bg-amber-500",
    label: "DUPLICADO",
    sub: "Ya escaneado en esta sesión",
  },
  not_found: {
    bg: "bg-red-600",
    label: "NO REGISTRADO",
    sub: "Código no existe en inventario",
  },
};

export function BarcodeScanner({ onScan, onClose, disabled }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanningRef = useRef(false);
  const cooldownRef = useRef(false);
  const [overlay, setOverlay] = useState<OverlayState>(null);
  const [overlayDetail, setOverlayDetail] = useState<string>("");
  const [torchOn, setTorchOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const showFeedback = useCallback((result: ScanProcessResult) => {
    const state = (result.result ?? "not_found") as OverlayState;
    setOverlay(state);
    setOverlayDetail(
      result.item
        ? `${result.item.description}\nEsp: ${result.item.expected_quantity} · Enc: ${result.item.found_quantity}`
        : result.message ?? ""
    );

    if (state === "found" || state === "group_reconciled") {
      playBeep(880);
      vibrate(30);
    } else if (state === "duplicate") {
      playBeep(440, 0.12);
      vibrate([50, 30, 50]);
    } else {
      playBeep(220, 0.2);
      vibrate(100);
    }

    setTimeout(() => {
      setOverlay(null);
      cooldownRef.current = false;
    }, 900);
  }, []);

  const handleDecode = useCallback(
    async (text: string) => {
      if (cooldownRef.current || disabled) return;
      cooldownRef.current = true;
      const result = await onScan(text);
      showFeedback(result);
    },
    [onScan, showFeedback, disabled]
  );

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new BrowserMultiFormatReader(hints, 150);
    readerRef.current = reader;
    scanningRef.current = true;

    const start = async () => {
      try {
        const devices = await reader.listVideoInputDevices();
        const backCam =
          devices.find((d) => /back|rear|environment/i.test(d.label))?.deviceId ??
          devices[devices.length - 1]?.deviceId;

        await reader.decodeFromVideoDevice(
          backCam ?? undefined,
          videoRef.current!,
          (res, err) => {
            if (!scanningRef.current) return;
            if (res) {
              handleDecode(res.getText());
            }
            if (err && !(err as { name?: string }).name?.includes("NotFound")) {
              /* continuous scan — ignore frame errors */
            }
          }
        );

        const stream = videoRef.current?.srcObject as MediaStream | null;
        streamRef.current = stream;
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "No se pudo acceder a la cámara"
        );
      }
    };

    start();

    return () => {
      scanningRef.current = false;
      reader.reset();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [handleDecode]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const capabilities = track.getCapabilities() as MediaTrackCapabilities & {
        torch?: boolean;
      };
      if (!capabilities.torch) return;
      await track.applyConstraints({
        advanced: [{ torch: !torchOn } as MediaTrackConstraintSet],
      });
      setTorchOn(!torchOn);
    } catch {
      /* torch not supported */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Scan frame */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-48 w-[85%] max-w-sm rounded-2xl border-2 border-emerald-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Button variant="secondary" size="icon" onClick={onClose} aria-label="Cerrar">
          <X className="h-6 w-6" />
        </Button>
        <p className="text-sm font-bold uppercase tracking-widest text-white/90">
          Escaneo continuo
        </p>
        <Button variant="secondary" size="icon" onClick={toggleTorch} aria-label="Linterna">
          {torchOn ? <FlashlightOff className="h-6 w-6" /> : <Flashlight className="h-6 w-6" />}
        </Button>
      </div>

      {error && (
        <div className="relative z-10 mx-4 rounded-xl bg-red-600/90 p-4 text-center text-white">
          {error}
        </div>
      )}

      {/* Result overlay */}
      <AnimatePresence>
        {overlay && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "absolute inset-x-4 top-1/3 z-20 flex min-h-[200px] flex-col items-center justify-center rounded-3xl p-6 text-center shadow-2xl",
              OVERLAY_CONFIG[overlay]?.bg ?? "bg-slate-700"
            )}
          >
            <p className="text-4xl font-black tracking-tight text-white">
              {OVERLAY_CONFIG[overlay]?.label}
            </p>
            <p className="mt-2 text-lg font-medium text-white/90">
              {OVERLAY_CONFIG[overlay]?.sub}
            </p>
            {overlayDetail && (
              <p className="mt-4 max-w-sm whitespace-pre-line text-sm text-white/80">
                {overlayDetail}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 mt-auto p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center">
        <p className="text-sm text-white/70">Apunta al código de barras institucional</p>
      </div>
    </div>
  );
}
