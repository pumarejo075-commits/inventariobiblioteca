#!/usr/bin/env node
/**
 * Carga inventario UACH desde db/seed/inventory-uach-2025.json (idempotente).
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

try {
  const envPath = join(root, ".env.local");
  const env = readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) {
      process.env[m[1].trim()] = m[2].trim();
    }
  }
} catch {
  /* no .env.local */
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

function sslConfig(connectionString) {
  if (process.env.DATABASE_SSL === "true") return { rejectUnauthorized: false };
  if (
    connectionString.includes("sslmode=require") ||
    connectionString.includes("railway.app") ||
    connectionString.includes("rlwy.net")
  ) {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

const seed = JSON.parse(
  readFileSync(join(root, "db/seed/inventory-uach-2025.json"), "utf8")
);
const sessionId = seed.defaultSessionId;

const client = new pg.Client({
  connectionString: url,
  ssl: sslConfig(url),
});
await client.connect();

const { rows: countRows } = await client.query(
  "SELECT COUNT(*)::int AS n FROM inventory_items"
);
const existing = countRows[0]?.n ?? 0;

console.log(`[BiblioScan] Inventario actual: ${existing} ítems`);

let imported = 0;
let failed = 0;
for (const item of seed.items) {
  try {
  await client.query(
    `INSERT INTO inventory_items (
      barcode, clave, resguardo, description, brand, model, serial, status,
      invoice_number, invoice_date, depreciated_cost, responsible_person, location,
      expected_quantity, found_quantity, is_group
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8::asset_status,
      $9, $10, $11, $12, $13, $14, $15, $16
    )
    ON CONFLICT (barcode) DO UPDATE SET
      clave = EXCLUDED.clave,
      description = EXCLUDED.description,
      brand = EXCLUDED.brand,
      model = EXCLUDED.model,
      serial = EXCLUDED.serial,
      responsible_person = EXCLUDED.responsible_person,
      location = EXCLUDED.location,
      expected_quantity = EXCLUDED.expected_quantity,
      updated_at = NOW()`,
    [
      item.barcode,
      item.clave,
      item.resguardo,
      item.description,
      item.brand,
      item.model,
      item.serial,
      item.status ?? "active",
      item.invoice_number,
      item.invoice_date,
      item.depreciated_cost,
      item.responsible_person,
      item.location,
      item.expected_quantity,
      item.found_quantity ?? 0,
      item.is_group ?? false,
    ]
  );
  imported++;
  } catch (e) {
    failed++;
    console.error(`  ✗ ${item.barcode}: ${e instanceof Error ? e.message : e}`);
  }
}

const link = await client.query(
  `INSERT INTO inventory_session_items (session_id, item_id, expected_quantity, found_quantity)
   SELECT $1, i.id, i.expected_quantity, 0
   FROM inventory_items i
   ON CONFLICT (session_id, item_id) DO NOTHING
   RETURNING 1`,
  [sessionId]
);

const { rows: finalRows } = await client.query(
  "SELECT COUNT(*)::int AS n FROM inventory_items"
);

await client.end();
if (failed > 0) {
  console.error(`[BiblioScan] Seed: ${failed} filas con error`);
  process.exit(1);
}
console.log(
  `[BiblioScan] Seed inventario: ${imported} upserts, ${link.rowCount} vínculos sesión nuevos, total ${finalRows[0].n} ítems`
);
