"use client";

import { useEffect, useState, useCallback } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Input } from "@/components/ui/input";
import { ReconciliationCard } from "@/components/reconciliation/reconciliation-card";
import type { ReconciliationRow } from "@/types/database";

type StatusFilter = "complete" | "incomplete" | "excess";

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "complete", label: "Completos" },
  { id: "incomplete", label: "Incompletos" },
  { id: "excess", label: "Excedidos" },
];

export default function AssetsPage() {
  const [rows, setRows] = useState<ReconciliationRow[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("incomplete");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ filter: statusFilter });
    if (q) params.set("q", q);
    const res = await fetch(`/api/reconciliation?${params}`);
    const data: ReconciliationRow[] = await res.json();
    setRows(data ?? []);
    setLoading(false);
  }, [q, statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  return (
    <>
      <AppHeader title="Activos" />
      <main className="mx-auto max-w-lg space-y-3 px-4 py-4">
        <Input
          placeholder="Buscar clave, descripción..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="flex gap-2">
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatusFilter(id)}
              className={`flex-1 rounded-xl py-3 text-xs font-bold uppercase sm:text-sm ${
                statusFilter === id
                  ? id === "complete"
                    ? "bg-emerald-500 text-slate-950"
                    : id === "excess"
                      ? "bg-blue-500 text-white"
                      : "bg-red-500 text-white"
                  : "border border-slate-700 bg-slate-900 text-slate-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-500">
          {rows.length} activos · {FILTERS.find((f) => f.id === statusFilter)?.label}
        </p>

        {loading ? (
          <p className="text-center text-slate-500">Cargando...</p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-slate-500">Ningún activo en esta categoría</p>
        ) : (
          rows.map((r) => (
            <ReconciliationCard
              key={r.id}
              title={r.description}
              subtitle={`${r.clave}${r.location ? ` · ${r.location}` : ""}`}
              expected={r.expected_quantity}
              found={r.found_quantity}
              missing={r.missing_quantity}
              excess={r.excess_quantity}
              compact
            />
          ))
        )}
      </main>
    </>
  );
}
