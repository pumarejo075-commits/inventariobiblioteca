"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/hooks/use-session";
import type { ReconciliationRow } from "@/types/database";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/reports/export";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

export default function ReportsPage() {
  const { activeSession } = useSessionStore();
  const [rows, setRows] = useState<ReconciliationRow[]>([]);
  const [tab, setTab] = useState<"missing" | "found" | "all">("missing");

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeSession) params.set("sessionId", activeSession.id);
    if (tab === "missing") params.set("filter", "missing");
    if (tab === "found") params.set("filter", "found");
    fetch(`/api/reconciliation?${params}`).then((r) => r.json()).then(setRows);
  }, [activeSession, tab]);

  const filename = `biblioscan-${activeSession?.name ?? "global"}-${tab}`;
  const title = `Reporte ${tab} — ${activeSession?.name ?? "Inventario global"}`;

  const stats = {
    total: rows.length,
    missing: rows.filter((r) => r.missing_quantity > 0).length,
    complete: rows.filter((r) => r.missing_quantity === 0 && r.found_quantity > 0).length,
    percent:
      rows.length > 0
        ? (rows.reduce((s, r) => s + r.found_quantity, 0) /
            rows.reduce((s, r) => s + r.expected_quantity, 0)) *
          100
        : 0,
  };

  return (
    <>
      <AppHeader title="Reportes" />
      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-900 p-4 text-center">
          <div>
            <p className="text-2xl font-black text-slate-100">{stats.total}</p>
            <p className="text-[10px] uppercase text-slate-500">Ítems</p>
          </div>
          <div>
            <p className="text-2xl font-black text-amber-400">{stats.missing}</p>
            <p className="text-[10px] uppercase text-slate-500">Faltantes</p>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-400">{stats.percent.toFixed(0)}%</p>
            <p className="text-[10px] uppercase text-slate-500">Avance</p>
          </div>
        </div>

        <div className="flex gap-2">
          {(["missing", "found", "all"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 rounded-xl py-3 text-xs font-bold uppercase ${
                tab === t ? "bg-emerald-500 text-slate-950" : "bg-slate-900 text-slate-400"
              }`}
            >
              {t === "missing" ? "Faltantes" : t === "found" ? "Encontrados" : "Todos"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button variant="secondary" className="flex-col gap-1 h-auto py-4" onClick={() => exportToCSV(rows, filename)}>
            <Download className="h-5 w-5" />
            <span className="text-xs">CSV</span>
          </Button>
          <Button variant="secondary" className="flex-col gap-1 h-auto py-4" onClick={() => exportToExcel(rows, filename)}>
            <FileSpreadsheet className="h-5 w-5" />
            <span className="text-xs">Excel</span>
          </Button>
          <Button variant="secondary" className="flex-col gap-1 h-auto py-4" onClick={() => exportToPDF(rows, title, filename)}>
            <FileText className="h-5 w-5" />
            <span className="text-xs">PDF</span>
          </Button>
        </div>

        <ul className="space-y-2">
          {rows.slice(0, 30).map((r) => (
            <li
              key={r.id ?? r.barcode}
              className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
            >
              <p className="font-semibold text-slate-100">{r.description}</p>
              <p className="text-xs text-slate-500">
                Esp {r.expected_quantity} · Enc {r.found_quantity} · Falta {r.missing_quantity}
              </p>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
