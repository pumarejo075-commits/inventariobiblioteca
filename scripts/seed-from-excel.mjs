#!/usr/bin/env node
import { readFileSync } from "fs";
import pg from "pg";
import XLSX from "xlsx";

const file =
  process.argv[2] ??
  "RELACION DE ACTIVOS DES DE LA SALUD AL 17-OCT-2025.xlsx";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL");
  process.exit(1);
}

const wb = XLSX.read(readFileSync(file));
const sheet = wb.Sheets[wb.SheetNames[0]];
const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });
const headers = raw[0].map((h) => (h == null ? "" : String(h)));

const idx = (name) => {
  const n = name.toLowerCase();
  return headers.findIndex((h) => h.toLowerCase().includes(n));
};

const rows = [];
for (let i = 1; i < raw.length; i++) {
  const r = raw[i];
  if (!r || r.every((c) => c == null)) continue;
  const clave = String(r[idx("clave")] ?? "").trim();
  const desc = String(r[idx("desc")] ?? "").trim();
  if (!clave || !desc) continue;
  const ubic = r[r.length - 1];
  rows.push({
    barcode: clave.replace(/\s+/g, ""),
    clave,
    resguardo: r[idx("resguardo")] != null ? String(r[idx("resguardo")]) : null,
    description: desc,
    brand: r[idx("marca")] != null ? String(r[idx("marca")]) : null,
    model: r[idx("modelo")] != null ? String(r[idx("modelo")]) : null,
    serial: r[idx("serie")] != null ? String(r[idx("serie")]) : null,
    status: "active",
    responsible_person: r[idx("responsable")] != null ? String(r[idx("responsable")]) : null,
    location: ubic != null ? String(ubic) : null,
    expected_quantity: Math.max(1, Number(r[idx("existe")] ?? r[idx("cantidad")]) || 1),
    found_quantity: 0,
    is_group: false,
  });
}

const client = new pg.Client({ connectionString: url });
await client.connect();

let imported = 0;
for (const item of rows) {
  await client.query(
    `INSERT INTO inventory_items (
      barcode, clave, resguardo, description, brand, model, serial, status,
      responsible_person, location, expected_quantity, found_quantity, is_group
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::asset_status,$9,$10,$11,$12,$13)
    ON CONFLICT (barcode) DO UPDATE SET
      description = EXCLUDED.description,
      expected_quantity = EXCLUDED.expected_quantity,
      updated_at = NOW()`,
    [
      item.barcode, item.clave, item.resguardo, item.description,
      item.brand, item.model, item.serial, item.status,
      item.responsible_person, item.location, item.expected_quantity,
      item.found_quantity, item.is_group,
    ]
  );
  imported++;
  if (imported % 20 === 0) console.log(`${imported}/${rows.length}`);
}

await client.end();
console.log("Done:", imported, "items");
