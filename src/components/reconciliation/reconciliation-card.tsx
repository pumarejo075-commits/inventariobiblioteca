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
        highlight
          ? "border-[var(--success-border)] bg-[var(--success-bg)]"
          : "border-[var(--border)] bg-white shadow-sm",
        onClick && "cursor-pointer hover:border-[var(--accent-warm)]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={cn("font-bold text-[var(--foreground)]", compact ? "text-sm" : "text-base")}>
            {title}
          </p>
          {subtitle && (
            <p className="truncate text-xs text-[var(--foreground-muted)]">{subtitle}</p>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-lg px-2 py-1 text-xs font-bold",
            status === "complete" && "bg-[var(--success-bg)] text-[var(--success)]",
            status === "missing" && "bg-[var(--danger-bg)] text-[var(--danger)]",
            status === "excess" && "bg-[var(--info-bg)] text-[var(--info)]"
          )}
        >
          {percent.toFixed(0)}%
        </span>
      </div>

      <div className={cn("mt-3 grid grid-cols-3 gap-2", compact && "mt-2")}>
        <Stat label="Esperado" value={expected} />
        <Stat label="Encontrado" value={found} accent="success" />
        <Stat label="Faltante" value={missing} accent={missing > 0 ? "danger" : undefined} />
      </div>
      {excess > 0 && (
        <p className="mt-2 text-xs font-medium text-[var(--info)]">
          Excedente: {formatNumber(excess)}
        </p>
      )}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-elevated)]">
        <div
          className="h-full rounded-full bg-[var(--success)] transition-all duration-300"
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
  accent?: "success" | "danger";
}) {
  return (
    <div className="rounded-xl bg-[var(--surface)] px-2 py-2 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
        {label}
      </p>
      <p
        className={cn(
          "text-xl font-black tabular-nums",
          accent === "success" && "text-[var(--success)]",
          accent === "danger" && "text-[var(--danger)]",
          !accent && "text-[var(--foreground)]"
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
      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 text-center shadow-sm">
        <p className="text-xs uppercase text-[var(--foreground-muted)]">Esperado</p>
        <p className="text-3xl font-black text-[var(--foreground)]">{formatNumber(expected)}</p>
      </div>
      <div className="rounded-2xl border border-[var(--success-border)] bg-[var(--success-bg)] p-4 text-center">
        <p className="text-xs uppercase text-[var(--success)]">Encontrado</p>
        <p className="text-3xl font-black text-[var(--success)]">{formatNumber(found)}</p>
      </div>
      <div className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-bg)] p-4 text-center">
        <p className="text-xs uppercase text-[var(--danger)]">Faltante</p>
        <p className="text-3xl font-black text-[var(--danger)]">{formatNumber(missing)}</p>
      </div>
      <p className="col-span-3 text-center text-sm text-[var(--foreground-muted)]">
        Reconciliación global:{" "}
        <span className="font-bold text-[var(--success)]">{percent.toFixed(1)}%</span>
      </p>
    </div>
  );
}
