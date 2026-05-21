"use client";

import { motion } from "framer-motion";
import { cn, formatNumber } from "@/lib/utils";

interface ReconciliationCardProps {
  title: string;
  subtitle?: string;
  expected: number;
  found: number;
  missing: number;
  excess?: number;
  compact?: boolean;
  highlight?: boolean;
  onClick?: () => void;
}

export function ReconciliationCard({
  title,
  subtitle,
  expected,
  found,
  missing,
  excess = 0,
  compact,
  highlight,
  onClick,
}: ReconciliationCardProps) {
  const percent = expected > 0 ? Math.min(100, (found / expected) * 100) : 0;
  const status =
    missing === 0 && excess === 0 ? "complete" : missing > 0 ? "missing" : "excess";

  return (
    <motion.button
      type="button"
      layout
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border p-4 text-left transition-colors active:scale-[0.99]",
        highlight ? "border-emerald-500/50 bg-emerald-500/10" : "border-slate-800 bg-slate-900",
        onClick && "cursor-pointer hover:border-slate-600"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={cn("font-bold text-slate-100", compact ? "text-sm" : "text-base")}>
            {title}
          </p>
          {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-lg px-2 py-1 text-xs font-bold",
            status === "complete" && "bg-emerald-500/20 text-emerald-400",
            status === "missing" && "bg-amber-500/20 text-amber-400",
            status === "excess" && "bg-blue-500/20 text-blue-400"
          )}
        >
          {percent.toFixed(0)}%
        </span>
      </div>

      <div className={cn("mt-3 grid grid-cols-3 gap-2", compact && "mt-2")}>
        <Stat label="Esperado" value={expected} />
        <Stat label="Encontrado" value={found} accent="emerald" />
        <Stat label="Faltante" value={missing} accent={missing > 0 ? "amber" : undefined} />
      </div>
      {excess > 0 && (
        <p className="mt-2 text-xs font-medium text-blue-400">Excedente: {formatNumber(excess)}</p>
      )}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </motion.button>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "emerald" | "amber";
}) {
  return (
    <div className="rounded-xl bg-slate-950/60 px-2 py-2 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p
        className={cn(
          "text-xl font-black tabular-nums",
          accent === "emerald" && "text-emerald-400",
          accent === "amber" && "text-amber-400",
          !accent && "text-slate-200"
        )}
      >
        {formatNumber(value)}
      </p>
    </div>
  );
}

export function ReconciliationSummary({
  expected,
  found,
  missing,
}: {
  expected: number;
  found: number;
  missing: number;
}) {
  const percent = expected > 0 ? (found / expected) * 100 : 0;
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-2xl bg-slate-900 p-4 text-center">
        <p className="text-xs uppercase text-slate-500">Esperado</p>
        <p className="text-3xl font-black text-slate-100">{formatNumber(expected)}</p>
      </div>
      <div className="rounded-2xl bg-emerald-500/10 p-4 text-center ring-1 ring-emerald-500/30">
        <p className="text-xs uppercase text-emerald-600">Encontrado</p>
        <p className="text-3xl font-black text-emerald-400">{formatNumber(found)}</p>
      </div>
      <div className="rounded-2xl bg-amber-500/10 p-4 text-center ring-1 ring-amber-500/30">
        <p className="text-xs uppercase text-amber-600">Faltante</p>
        <p className="text-3xl font-black text-amber-400">{formatNumber(missing)}</p>
      </div>
      <p className="col-span-3 text-center text-sm text-slate-400">
        Reconciliación global: <span className="font-bold text-emerald-400">{percent.toFixed(1)}%</span>
      </p>
    </div>
  );
}
