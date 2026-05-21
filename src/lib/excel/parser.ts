import * as XLSX from "xlsx";
import { EXCEL_COLUMN_MAP, type ExcelField } from "@/types/database";
import { parseExcelDateValue } from "@/lib/excel/date";
import { normalizeBarcodeKey } from "@/lib/utils";

export interface ParsedExcelRow {
  clave: string;
  resguardo?: string;
  cantidadAlta?: number;
  cantidadExiste: number;
  descCorta: string;
  marca?: string;
  modelo?: string;
  serie?: string;
  status?: string;
  Factura?: string;
  FechaFactura?: string;
  CostoDepreciado?: number;
  Responsable?: string;
  Ubicación?: string;
  _rowIndex: number;
}

export interface ColumnMapping {
  [excelHeader: string]: ExcelField | null;
}

export interface ImportPreview {
  headers: string[];
  mapping: ColumnMapping;
  rows: ParsedExcelRow[];
  errors: { row: number; message: string }[];
  duplicates: string[];
}

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const fieldEntries = Object.entries(EXCEL_COLUMN_MAP) as [ExcelField, readonly string[]][];

  for (const header of headers) {
    const norm = normalizeHeader(header);
    let matched: ExcelField | null = null;
    for (const [field, aliases] of fieldEntries) {
      if (aliases.some((a) => normalizeHeader(a) === norm)) {
        matched = field;
        break;
      }
    }
    if (!matched && norm.includes("ubic")) matched = "Ubicación";
    mapping[header] = matched;
  }
  return mapping;
}

function cellValue(row: unknown[], index: number): unknown {
  return index >= 0 ? row[index] : undefined;
}

export function parseExcelFile(
  buffer: ArrayBuffer,
  customMapping?: ColumnMapping
): ImportPreview {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
  const headers = (raw[0] as string[]).map((h) => (h == null ? "" : String(h)));
  const mapping = customMapping ?? autoMapColumns(headers);

  const headerIndex: Partial<Record<ExcelField, number>> = {};
  Object.entries(mapping).forEach(([header, field]) => {
    if (field) headerIndex[field] = headers.indexOf(header);
  });

  const rows: ParsedExcelRow[] = [];
  const errors: { row: number; message: string }[] = [];
  const claveSet = new Map<string, number>();
  const duplicates: string[] = [];

  for (let i = 1; i < raw.length; i++) {
    const row = raw[i] as unknown[];
    if (!row || row.every((c) => c == null || c === "")) continue;

    const claveIdx = headerIndex.clave ?? -1;
    const descIdx = headerIndex.descCorta ?? -1;
    const clave = String(cellValue(row, claveIdx) ?? "").trim();
    const desc = String(cellValue(row, descIdx) ?? "").trim();

    if (!clave) {
      errors.push({ row: i + 1, message: "Falta clave / código de barras" });
      continue;
    }
    if (!desc) {
      errors.push({ row: i + 1, message: "Falta descripción" });
      continue;
    }

    const key = normalizeBarcodeKey(clave);
    if (claveSet.has(key)) {
      duplicates.push(clave);
    } else {
      claveSet.set(key, i);
    }

    const qtyRaw = cellValue(row, headerIndex.cantidadExiste ?? -1);
    const cantidadExiste = Math.max(0, Number(qtyRaw) || 1);

    rows.push({
      clave,
      resguardo: cellValue(row, headerIndex.resguardo ?? -1)?.toString(),
      cantidadAlta: Number(cellValue(row, headerIndex.cantidadAlta ?? -1)) || undefined,
      cantidadExiste,
      descCorta: desc,
      marca: cellValue(row, headerIndex.marca ?? -1)?.toString(),
      modelo: cellValue(row, headerIndex.modelo ?? -1)?.toString(),
      serie: cellValue(row, headerIndex.serie ?? -1)?.toString(),
      status: cellValue(row, headerIndex.status ?? -1)?.toString(),
      Factura: cellValue(row, headerIndex.Factura ?? -1)?.toString(),
      FechaFactura: parseExcelDateValue(cellValue(row, headerIndex.FechaFactura ?? -1)) ?? undefined,
      CostoDepreciado: Number(cellValue(row, headerIndex.CostoDepreciado ?? -1)) || undefined,
      Responsable: cellValue(row, headerIndex.Responsable ?? -1)?.toString(),
      Ubicación: cellValue(row, headerIndex.Ubicación ?? -1)?.toString(),
      _rowIndex: i + 1,
    });
  }

  return { headers, mapping, rows, errors, duplicates: [...new Set(duplicates)] };
}

export function rowsToInventoryPayload(rows: ParsedExcelRow[]) {
  return rows.map((r) => ({
    barcode: normalizeBarcodeKey(r.clave),
    clave: r.clave,
    resguardo: r.resguardo ?? null,
    description: r.descCorta,
    brand: r.marca ?? null,
    model: r.modelo ?? null,
    serial: r.serie ?? null,
    status: r.status === "B" ? "inactive" : "active",
    invoice_number: r.Factura ?? null,
    invoice_date: parseExcelDateValue(r.FechaFactura) ?? null,
    depreciated_cost: r.CostoDepreciado ?? null,
    responsible_person: r.Responsable ?? null,
    location: r.Ubicación ?? null,
    expected_quantity: r.cantidadExiste,
    found_quantity: 0,
    is_group: false,
  }));
}
