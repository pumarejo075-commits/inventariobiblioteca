"use client";

import { useEffect, useState, useCallback } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Input } from "@/components/ui/input";
import { ReconciliationCard } from "@/components/reconciliation/reconciliation-card";
import type { ReconciliationRow } from "@/types/database";

export default function AssetsPage() {
  const [rows, setRows] = useState<ReconciliationRow[]>([]);
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ filter: "all" });
    if (q) params.set("q", q);
    const res = await fetch(`/api/reconciliation?${params}`);
    let data: ReconciliationRow[] = await res.json();
    if (location) {
      data = data.filter((r) =>
        (r.location ?? "").toLowerCase().includes(location.toLowerCase())
      );
    }
    setRows(data ?? []);
    setLoading(false);
  }, [q, location]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <>
      <AppHeader title="Activos" />
      <main className="mx-auto max-w-lg space-y-3 px-4 py-4">
        <Input
          placeholder="Buscar clave, descripción..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Input
          placeholder="Filtrar ubicación"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <p className="text-xs text-slate-500">{rows.length} activos</p>
        {loading ? (
          <p className="text-center text-slate-500">Cargando...</p>
        ) : (
          rows.map((r) => (
            <ReconciliationCard
              key={r.id}
              title={r.description}
              subtitle={`${r.clave} · ${r.location ?? "Sin ubicación"}`}
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
