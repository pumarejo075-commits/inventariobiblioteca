import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReconciliationRow } from "@/types/database";

export function exportToCSV(rows: ReconciliationRow[], filename: string) {
  const headers = [
    "Clave",
    "Descripción",
    "Esperado",
    "Encontrado",
    "Faltante",
    "Excedente",
    "%",
    "Ubicación",
    "Responsable",
  ];
  const data = rows.map((r) => [
    r.clave,
    r.description,
    r.expected_quantity,
    r.found_quantity,
    r.missing_quantity,
    r.excess_quantity,
    r.reconciliation_percent,
    r.location ?? "",
    r.responsible_person ?? "",
  ]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reconciliación");
  XLSX.writeFile(wb, `${filename}.csv`);
}

export function exportToExcel(rows: ReconciliationRow[], filename: string) {
  const data = rows.map((r) => ({
    Clave: r.clave,
    "Código barras": r.barcode,
    Descripción: r.description,
    Marca: r.brand ?? "",
    Modelo: r.model ?? "",
    Esperado: r.expected_quantity,
    Encontrado: r.found_quantity,
    Faltante: r.missing_quantity,
    Excedente: r.excess_quantity,
    "Reconciliación %": r.reconciliation_percent,
    Ubicación: r.location ?? "",
    Responsable: r.responsible_person ?? "",
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reconciliación");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToPDF(rows: ReconciliationRow[], title: string, filename: string) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(title, 14, 15);
  autoTable(doc, {
    startY: 22,
    head: [["Clave", "Descripción", "Esp.", "Enc.", "Falt.", "Ubicación"]],
    body: rows.map((r) => [
      r.clave,
      r.description.slice(0, 40),
      String(r.expected_quantity),
      String(r.found_quantity),
      String(r.missing_quantity),
      (r.location ?? "").slice(0, 30),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 23, 42] },
  });
  doc.save(`${filename}.pdf`);
}
