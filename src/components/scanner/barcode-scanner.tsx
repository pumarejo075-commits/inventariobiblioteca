"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  MultiFormatReader,
  RGBLuminanceSource,
} from "@zxing/library";
import { motion, AnimatePresence } from "framer-motion";
import { Flashlight, FlashlightOff, Keyboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, initAudioOnGesture, playBeep, vibrate } from "@/lib/utils";
import type { ScanProcessResult, ScanResult } from "@/types/database";

interface BarcodeScannerProps {
  onScan: (barcode: string) => Promise<ScanProcessResult>;
  onClose?: () => void;
  disabled?: boolean;
}

type OverlayState = ScanResult | "not_found" | null;

const OVERLAY_MS = 2000;

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

function buildHintMap() {
  const hints = new Map();
  hints.set(DecodeHintType.TRY_HARDER, true);
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.ITF,
    BarcodeFormat.CODABAR,
  ]);
  return hints;
}

function buildBitmapReader() {
  const reader = new MultiFormatReader();
  reader.setHints(buildHintMap());
  return reader;
}

export function BarcodeScanner({ onScan, onClose, disabled }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readerRef = useRef<MultiFormatReader | null>(null);
  const scanningRef = useRef(false);
  const cooldownRef = useRef(false);
  const rafRef = useRef<number>(0);
  const [overlay, setOverlay] = useState<OverlayState>(null);
  const [overlayDetail, setOverlayDetail] = useState("");
  const [overlayBarcode, setOverlayBarcode] = useState("");
  const [processing, setProcessing] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);

  const showFeedback = useCallback((result: ScanProcessResult, barcode: string) => {
    const state = (result.result ?? "not_found") as OverlayState;
    setProcessing(false);
    setOverlay(state);
    setOverlayBarcode(barcode);
    setOverlayDetail(
      result.item
        ? `${result.item.description}\n${result.item.clave ?? barcode}\nEsp: ${result.item.expected_quantity} · Enc: ${result.item.found_quantity}`
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
    }, OVERLAY_MS);
  }, []);

  const handleDecode = useCallback(
    async (text: string) => {
      const code = text.trim();
      if (!code || cooldownRef.current || disabled) return;
      cooldownRef.current = true;
      setProcessing(true);
      setLastAttempt(code);
      initAudioOnGesture();

      try {
        const result = await onScan(code);
        showFeedback(result, code);
      } catch {
        showFeedback(
          { result: "not_found", message: "Error de red. Reintenta." },
          code
        );
      }
    },
    [onScan, showFeedback, disabled]
  );

  const tryDecodeCanvas = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const reader = readerRef.current;
    if (!video || !canvas || !reader || video.readyState < 2) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return;

    const cropW = Math.floor(vw * 0.85);
    const cropH = Math.floor(vh * 0.35);
    const sx = Math.floor((vw - cropW) / 2);
    const sy = Math.floor((vh - cropH) / 2);

    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, cropW, cropH);

    if (typeof BarcodeDetector !== "undefined" && detectorRef.current) {
      try {
        const detected = await detectorRef.current.detect(canvas);
        if (detected[0]?.rawValue) {
          void handleDecode(detected[0].rawValue);
          return;
        }
      } catch {
        /* try zxing next */
      }
    }

    try {
      const imageData = ctx.getImageData(0, 0, cropW, cropH);
      const gray = new Uint8ClampedArray(cropW * cropH);
      const d = imageData.data;
      for (let i = 0; i < gray.length; i++) {
        const o = i * 4;
        gray[i] = (d[o] + d[o + 1] + d[o + 2]) / 3;
      }
      const source = new RGBLuminanceSource(gray, cropW, cropH);
      const bitmap = new BinaryBitmap(new HybridBinarizer(source));
      const result = reader.decode(bitmap);
      if (result?.getText()) void handleDecode(result.getText());
    } catch {
      /* no barcode this frame */
    }
  }, [handleDecode]);

  useEffect(() => {
    scanningRef.current = true;
    readerRef.current = buildBitmapReader();

    if (typeof BarcodeDetector !== "undefined") {
      try {
        detectorRef.current = new BarcodeDetector({
          formats: [
            "code_128",
            "code_39",
            "ean_13",
            "ean_8",
            "itf",
            "codabar",
          ],
        });
      } catch {
        detectorRef.current = null;
      }
    }

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }

        const loop = () => {
          if (!scanningRef.current) return;
          void tryDecodeCanvas();
          rafRef.current = window.setTimeout(loop, 120);
        };
        loop();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "No se pudo acceder a la cámara"
        );
      }
    };

    start();

    return () => {
      scanningRef.current = false;
      clearTimeout(rafRef.current);
      readerRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [tryDecodeCanvas]);

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

  const submitManual = () => {
    const code = manualCode.trim();
    if (!code) return;
    setManualOpen(false);
    setManualCode("");
    void handleDecode(code);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black"
      onPointerDown={initAudioOnGesture}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        muted
        autoPlay
      />
      <canvas ref={canvasRef} className="hidden" aria-hidden />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-48 w-[85%] max-w-sm rounded-2xl border-2 border-emerald-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
      </div>

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

      {processing && !overlay && (
        <div className="relative z-10 mx-4 rounded-xl bg-blue-600/90 px-4 py-3 text-center text-white">
          <p className="font-bold">Procesando…</p>
          {lastAttempt && (
            <p className="mt-1 font-mono text-sm break-all">{lastAttempt}</p>
          )}
        </div>
      )}

      {error && (
        <div className="relative z-10 mx-4 rounded-xl bg-red-600/90 p-4 text-center text-white">
          {error}
        </div>
      )}

      <AnimatePresence>
        {overlay && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "absolute inset-x-4 top-1/4 z-20 flex min-h-[220px] flex-col items-center justify-center rounded-3xl p-6 text-center shadow-2xl",
              OVERLAY_CONFIG[overlay]?.bg ?? "bg-slate-700"
            )}
          >
            <p className="font-mono text-sm text-white/80 break-all">{overlayBarcode}</p>
            <p className="mt-2 text-4xl font-black tracking-tight text-white">
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

      <div className="relative z-10 mt-auto space-y-3 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {lastAttempt && !processing && !overlay && (
          <p className="text-center text-xs text-white/60 break-all">
            Último: {lastAttempt}
          </p>
        )}
        <Button
          type="button"
          variant="secondary"
          className="w-full gap-2"
          onClick={() => setManualOpen(true)}
        >
          <Keyboard className="h-5 w-5" />
          Escribir código
        </Button>
        <p className="text-center text-sm text-white/70">
          Apunta al código de barras (sticker sin espacios)
        </p>
      </div>

      {manualOpen && (
        <div className="absolute inset-0 z-30 flex items-end bg-black/70 p-4">
          <div className="w-full space-y-3 rounded-2xl bg-white p-4 text-[var(--foreground)]">
            <p className="font-bold text-white">Código manual</p>
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Pega o escribe el código del sticker"
              className="font-mono"
              autoFocus
            />
            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setManualOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" className="flex-1" onClick={submitManual}>
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
