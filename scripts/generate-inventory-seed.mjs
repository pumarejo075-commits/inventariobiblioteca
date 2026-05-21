#!/usr/bin/env node
/**
 * Genera db/seed/inventory-uach-2025.json desde el Excel local.
 * Uso: node scripts/generate-inventory-seed.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const xlsxPath = join(
  root,
  "RELACION DE ACTIVOS DES DE LA SALUD AL 17-OCT-2025.xlsx"
);
const outPath = join(root, "db/seed/inventory-uach-2025.json");

function normalizeBarcodeKey(value) {
  return String(value).replace(/\s+/g, "").toUpperCase();
}

const EXCEL_COLUMN_MAP = {
  clave: ["clave", "codigo", "código", "barcode"],
  resguardo: ["resguardo"],
  cantidadAlta: ["cantidadalta", "cantidad alta"],
  cantidadExiste: ["cantidadexiste", "cantidad existe", "cantidad"],
  descCorta: ["desccorta", "desc corta", "descripcion", "descripción"],
  marca: ["marca"],
  modelo: ["modelo"],
  serie: ["serie"],
  status: ["status", "estatus"],
  Factura: ["factura"],
  FechaFactura: ["fechafactura", "fecha factura"],
  CostoDepreciado: ["costodepreciado", "costo depreciado"],
  Responsable: ["responsable"],
  "Ubicación": ["ubicacion", "ubicación", "ubicacion fisica"],
};

function normalizeHeader(h) {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function autoMapColumns(headers) {
  const mapping = {};
  const fieldEntries = Object.entries(EXCEL_COLUMN_MAP);
  for (const header of headers) {
    const norm = normalizeHeader(header);
    let matched = null;
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

const wb = XLSX.read(readFileSync(xlsxPath));
const sheet = wb.Sheets[wb.SheetNames[0]];
const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
const headers = raw[0].map((h) => (h == null ? "" : String(h)));
const mapping = autoMapColumns(headers);
const headerIndex = {};
Object.entries(mapping).forEach(([header, field]) => {
  if (field) headerIndex[field] = headers.indexOf(header);
});

const items = [];
for (let i = 1; i < raw.length; i++) {
  const row = raw[i];
  if (!row || row.every((c) => c == null || c === "")) continue;
  const clave = String(row[headerIndex.clave ?? 0] ?? "").trim();
  const desc = String(row[headerIndex.descCorta ?? 4] ?? "").trim();
  if (!clave || !desc) continue;

  const qtyRaw = row[headerIndex.cantidadExiste ?? -1];
  const cantidadExiste = Math.max(0, Number(qtyRaw) || 1);
  const statusRaw = row[headerIndex.status ?? -1];

  items.push({
    barcode: normalizeBarcodeKey(clave),
    clave,
    resguardo: row[headerIndex.resguardo ?? -1]?.toString() ?? null,
    description: desc,
    brand: row[headerIndex.marca ?? -1]?.toString() ?? null,
    model: row[headerIndex.modelo ?? -1]?.toString() ?? null,
    serial: row[headerIndex.serie ?? -1]?.toString() ?? null,
    status: statusRaw === "B" ? "inactive" : "active",
    invoice_number: row[headerIndex.Factura ?? -1]?.toString() ?? null,
    invoice_date: row[headerIndex.FechaFactura ?? -1]?.toString() ?? null,
    depreciated_cost: Number(row[headerIndex.CostoDepreciado ?? -1]) || null,
    responsible_person: row[headerIndex.Responsable ?? -1]?.toString() ?? null,
    location: row[headerIndex["Ubicación"] ?? -1]?.toString() ?? null,
    expected_quantity: cantidadExiste,
    found_quantity: 0,
    is_group: false,
  });
}

mkdirSync(join(root, "db/seed"), { recursive: true });
writeFileSync(
  outPath,
  JSON.stringify(
    {
      source: "RELACION DE ACTIVOS DES DE LA SALUD AL 17-OCT-2025.xlsx",
      generatedAt: new Date().toISOString(),
      count: items.length,
      defaultSessionId: "a0000000-0000-4000-8000-000000000001",
      items,
    },
    null,
    2
  )
);
console.log(`✓ ${items.length} activos → ${outPath}`);
