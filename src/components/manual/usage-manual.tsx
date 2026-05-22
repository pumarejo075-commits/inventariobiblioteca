"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ScanLine, Download, Package, WifiOff, BookOpen } from "lucide-react";

const STEPS = [
  {
    n: 1,
    title: "Entrar",
    text: "Abre BiblioScan, escribe tu correo y contraseña, y toca Iniciar sesión.",
  },
  {
    n: 2,
    title: "Ver el resumen (opcional)",
    text: "En Inicio ves cuántos activos debían existir, cuántos ya escaneaste y cuántos faltan.",
  },
  {
    n: 3,
    title: "Escanear",
    text: "Toca el botón verde Escanear (abajo en el centro o en Inicio). Se abre la cámara.",
  },
  {
    n: 4,
    title: "Apuntar al código",
    text: "Centra el código de barras en el recuadro. La app lee sola; no necesitas un botón extra.",
  },
  {
    n: 5,
    title: "Leer el color",
    text: "Verde = bien registrado. Amarillo = duplicado o de más. Rojo = no está en la lista.",
  },
  {
    n: 6,
    title: "Repetir",
    text: "Sigue con el siguiente activo: escanear → ver color → siguiente.",
  },
  {
    n: 7,
    title: "Ver la lista",
    text: "En Activos puedes buscar por nombre o clave y filtrar Incompletos para ver lo que falta.",
  },
  {
    n: 8,
    title: "Exportar (si te lo piden)",
    text: "En Inicio, el botón de descarga al lado de Escanear baja un Excel con el inventario.",
  },
];

const COLORS = [
  { color: "bg-emerald-500", label: "Verde", meaning: "Encontrado y contado" },
  { color: "bg-amber-500", label: "Amarillo", meaning: "Duplicado o excedente" },
  { color: "bg-red-600", label: "Rojo", meaning: "Código no registrado" },
];

export function UsageManual() {
  return (
    <Card className="border-emerald-500/30 bg-emerald-500/5">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 shrink-0 text-emerald-400" />
        <CardTitle className="text-base">Manual de uso</CardTitle>
      </div>
      <CardDescription className="mt-1">
        Guía rápida para contar activos con la cámara del celular.
      </CardDescription>

      <p className="mt-4 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-emerald-400">
        Regla de oro: Entrar → Escanear → apuntar al código → verde = bien, rojo = revisar →
        repetir.
      </p>

      <ol className="mt-4 space-y-3">
        {STEPS.map(({ n, title, text }) => (
          <li key={n} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-xs font-black text-slate-950">
              {n}
            </span>
            <div>
              <p className="text-sm font-bold text-slate-100">{title}</p>
              <p className="text-xs leading-relaxed text-slate-400">{text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
          Colores al escanear
        </p>
        <ul className="space-y-1.5">
          {COLORS.map(({ color, label, meaning }) => (
            <li key={label} className="flex items-center gap-2 text-xs text-slate-300">
              <span className={`h-3 w-3 shrink-0 rounded-full ${color}`} />
              <span className="font-semibold">{label}</span>
              <span className="text-slate-500">— {meaning}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
          <ScanLine className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <p className="text-[11px] text-slate-400">
            Sin leer bien: usa linterna o escribe el código a mano (teclado).
          </p>
        </div>
        <div className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
          <Package className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <p className="text-[11px] text-slate-400">
            Activos → Incompletos = lo que aún falta por escanear.
          </p>
        </div>
        <div className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-[11px] text-slate-400">
            Sin internet puedes escanear; sincroniza abajo cuando vuelva la red.
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
        <Download className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        <p className="text-[11px] text-slate-400">
          Para salir de la cámara usa la X. Para cerrar la app: sección de cuenta más abajo.
        </p>
      </div>
    </Card>
  );
}
