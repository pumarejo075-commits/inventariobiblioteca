"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ScanLine, Download, History } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { ReconciliationSummary } from "@/components/reconciliation/reconciliation-card";
import { Button } from "@/components/ui/button";
import { exportToExcel } from "@/lib/reports/export";
import { cn } from "@/lib/utils";
import type { ReconciliationRow, RecentScanRow, ScanResult } from "@/types/database";

const RESULT_LABEL: Record<ScanResult, { label: string; className: string }> = {
  found: { label: "Encontrado", className: "bg-emerald-500/20 text-emerald-400" },
  group_reconciled: { label: "Paquete", className: "bg-emerald-500/20 text-emerald-400" },
  duplicate: { label: "Duplicado", className: "bg-amber-500/20 text-amber-400" },
  not_found: { label: "No registrado", className: "bg-red-500/20 text-red-400" },
};

function formatScannedAt(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Hace un momento";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} h`;
  return d.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HomePage() {
  const [totalsRows, setTotalsRows] = useState<ReconciliationRow[]>([]);
  const [recentScans, setRecentScans] = useState<RecentScanRow[]>([]);
  const [loadingTotals, setLoadingTotals] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadTotals = useCallback(async () => {
    setLoadingTotals(true);
    const res = await fetch("/api/reconciliation?filter=all");
    const data = await res.json();
    setTotalsRows(data ?? []);
    setLoadingTotals(false);
  }, []);

  const loadRecent = useCallback(async () => {
    setLoadingRecent(true);
    const res = await fetch("/api/scans/recent");
    const data = await res.json();
    setRecentScans(Array.isArray(data) ? data : []);
    setLoadingRecent(false);
  }, []);

  const loadAll = useCallback(() => {
    void loadTotals();
    void loadRecent();
  }, [loadTotals, loadRecent]);

  useEffect(() => {
    loadAll();
    const onFocus = () => loadAll();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadAll]);

  const totals = totalsRows.reduce(
    (acc, r) => ({
      expected: acc.expected + (r.expected_quantity ?? 0),
      found: acc.found + (r.found_quantity ?? 0),
      missing: acc.missing + (r.missing_quantity ?? 0),
    }),
    { expected: 0, found: 0, missing: 0 }
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/reconciliation?filter=all");
      const data: ReconciliationRow[] = await res.json();
      if (!data?.length) {
        toast.error("No hay datos para exportar");
        return;
      }
      const date = new Date().toISOString().slice(0, 10);
      exportToExcel(data, `inventario-biblioteca-${date}`);
      toast.success(`Excel exportado (${data.length} activos)`);
    } catch {
      toast.error("No se pudo exportar el Excel");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <AppHeader title="Reconciliación" />
      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        {!loadingTotals && (
          <ReconciliationSummary
            expected={totals.expected}
            found={totals.found}
            missing={totals.missing}
          />
        )}

        <div className="flex gap-2">
          <Link href="/scanner" className="flex-1">
            <Button size="xl" className="w-full gap-2">
              <ScanLine className="h-6 w-6" />
              Escanear
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="icon"
            className="h-16 w-16 shrink-0"
            disabled={exporting}
            onClick={handleExport}
            aria-label="Exportar Excel"
          >
            <Download className="h-6 w-6" />
          </Button>
        </div>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-300">
            <History className="h-5 w-5" />
            <h2 className="font-bold uppercase tracking-wide">Últimos escaneados</h2>
          </div>

          {loadingRecent ? (
            <p className="py-8 text-center text-slate-500">Cargando...</p>
          ) : recentScans.length === 0 ? (
            <p className="py-8 text-center text-slate-500">
              Aún no hay escaneos. Usa Escanear para registrar activos.
            </p>
          ) : (
            <ul className="space-y-2">
              {recentScans.map((scan) => {
                const badge = RESULT_LABEL[scan.result] ?? RESULT_LABEL.not_found;
                const title =
                  scan.description ??
                  (scan.result === "not_found" ? "Código no registrado" : scan.barcode);
                const subtitle = [scan.clave ?? scan.barcode, formatScannedAt(scan.scanned_at)]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <li
                    key={scan.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-100">{title}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>
                        {scan.expected_quantity != null && scan.result !== "not_found" && (
                          <p className="mt-2 text-xs text-slate-400">
                            Encontrados: {scan.found_quantity ?? 0} / {scan.expected_quantity}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold uppercase",
                          badge.className
                        )}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
