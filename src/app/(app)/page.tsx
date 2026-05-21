"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ScanLine, Upload, AlertTriangle } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { ReconciliationSummary, ReconciliationCard } from "@/components/reconciliation/reconciliation-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSessionStore } from "@/hooks/use-session";
import type { ReconciliationRow } from "@/types/database";

export default function HomePage() {
  const { activeSession } = useSessionStore();
  const [rows, setRows] = useState<ReconciliationRow[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "missing">("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeSession) params.set("sessionId", activeSession.id);
    if (q) params.set("q", q);
    if (filter === "missing") params.set("filter", "missing");
    const res = await fetch(`/api/reconciliation?${params}`);
    const data = await res.json();
    setRows(data ?? []);
    setLoading(false);
  }, [activeSession, q, filter]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const totals = rows.reduce(
    (acc, r) => ({
      expected: acc.expected + (r.expected_quantity ?? 0),
      found: acc.found + (r.found_quantity ?? 0),
      missing: acc.missing + (r.missing_quantity ?? 0),
    }),
    { expected: 0, found: 0, missing: 0 }
  );

  const topMissing = rows.filter((r) => r.missing_quantity > 0).slice(0, 8);

  return (
    <>
      <AppHeader title="Reconciliación" />
      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        {!activeSession && (
          <div className="rounded-2xl border border-[var(--warning)]/30 bg-[var(--warning-bg)] p-4">
            <p className="font-bold text-[var(--warning)]">Sin sesión activa</p>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              Inicia una sesión de inventario para escanear activos.
            </p>
            <Button asChild className="mt-3 w-full" size="lg">
              <Link href="/sessions">Seleccionar sesión</Link>
            </Button>
          </div>
        )}

        <ReconciliationSummary
          expected={totals.expected}
          found={totals.found}
          missing={totals.missing}
        />

        <div className="flex gap-2">
          <Link href="/scanner" className="flex-1">
            <Button size="xl" className="w-full gap-2">
              <ScanLine className="h-6 w-6" />
              Escanear
            </Button>
          </Link>
          <Link href="/import">
            <Button variant="secondary" size="icon" className="h-16 w-16">
              <Upload className="h-6 w-6" />
            </Button>
          </Link>
        </div>

        <Input
          placeholder="Buscar clave, descripción, responsable..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="flex gap-2">
          {(["all", "missing"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`flex-1 rounded-xl py-3 text-sm font-bold uppercase ${
                filter === f
                  ? "bg-[var(--success)] text-white"
                  : "border border-[var(--border)] bg-white text-[var(--foreground-muted)]"
              }`}
            >
              {f === "all" ? "Todos" : "Faltantes"}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-8 text-center text-[var(--foreground-muted)]">Cargando...</p>
        ) : topMissing.length === 0 ? (
          <p className="py-8 text-center text-[var(--success)]">Sin faltantes detectados</p>
        ) : (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[var(--danger)]">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="font-bold uppercase tracking-wide">Prioridad — faltantes</h2>
            </div>
            {topMissing.map((r) => (
              <ReconciliationCard
                key={r.id ?? r.barcode}
                title={r.description}
                subtitle={r.clave}
                expected={r.expected_quantity}
                found={r.found_quantity}
                missing={r.missing_quantity}
                excess={r.excess_quantity}
                compact
              />
            ))}
          </section>
        )}
      </main>
    </>
  );
}
