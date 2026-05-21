"use client";

import { useCallback, useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { parseExcelFile, type ImportPreview } from "@/lib/excel/parser";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ImportPage() {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    const buffer = await f.arrayBuffer();
    const result = parseExcelFile(buffer);
    setPreview(result);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const confirmImport = async () => {
    if (!file) return;
    setImporting(true);
    const form = new FormData();
    form.append("file", file);
    form.append("confirm", "true");
    const res = await fetch("/api/import", { method: "POST", body: form });
    const data = await res.json();
    setImporting(false);
    if (res.ok) {
      toast.success(`Importados: ${data.imported}`);
      setPreview(null);
      setFile(null);
    } else {
      toast.error(data.error ?? "Error de importación");
    }
  };

  return (
    <>
      <AppHeader title="Importar Excel" />
      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-8 transition-colors ${
            dragOver
              ? "border-[var(--success)] bg-[var(--success-bg)]"
              : "border-[var(--border)] bg-white"
          }`}
        >
          <Upload className="h-12 w-12 text-[var(--success)]" />
          <p className="text-center font-semibold text-[var(--foreground)]">
            Arrastra el archivo Excel maestro aquí
          </p>
          <label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <Button asChild variant="secondary">
              <span>Seleccionar archivo</span>
            </Button>
          </label>
        </div>

        {preview && (
          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-[var(--success)]" />
              <div>
                <CardTitle>{file?.name}</CardTitle>
                <CardDescription>{preview.rows.length} filas válidas</CardDescription>
              </div>
            </div>

            {preview.duplicates.length > 0 && (
              <div className="flex gap-2 rounded-xl bg-[var(--warning-bg)] p-3 text-sm text-[var(--warning)]">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                {preview.duplicates.length} claves duplicadas en archivo
              </div>
            )}

            {preview.errors.length > 0 && (
              <p className="text-sm text-[var(--danger)]">{preview.errors.length} errores de validación</p>
            )}

            <div className="max-h-40 overflow-auto rounded-xl bg-[var(--surface)] p-3 text-xs text-[var(--foreground-muted)]">
              <p className="mb-2 font-bold text-[var(--foreground)]">Mapeo de columnas:</p>
              {Object.entries(preview.mapping).map(([h, f]) => (
                <p key={h}>
                  {h} → {f ?? "—"}
                </p>
              ))}
            </div>

            <div className="rounded-xl bg-[var(--surface)] p-3">
              <p className="mb-2 text-xs font-bold uppercase text-[var(--foreground-muted)]">Vista previa</p>
              {preview.rows.slice(0, 3).map((r) => (
                <p key={r._rowIndex} className="text-sm text-[var(--foreground)]">
                  {r.clave} — {r.descCorta} (×{r.cantidadExiste})
                </p>
              ))}
            </div>

            <Button size="lg" className="w-full" disabled={importing} onClick={confirmImport}>
              {importing ? "Importando..." : "Confirmar importación"}
            </Button>
          </Card>
        )}

        {!preview && (
          <Card>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
              Columnas soportadas
            </CardTitle>
            <CardDescription className="mt-2 leading-relaxed">
              clave, resguardo, cantidadAlta, cantidadExiste, descCorta, marca, modelo, serie,
              status, Factura, FechaFactura, CostoDepreciado, Responsable, Ubicación
            </CardDescription>
          </Card>
        )}
      </main>
    </>
  );
}
