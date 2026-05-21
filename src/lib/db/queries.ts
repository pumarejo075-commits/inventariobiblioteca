import { query } from "./pool";
import { INVENTORY_SESSION_ID } from "@/lib/inventory/constants";
import type { AppRole, InventorySession, ReconciliationRow } from "@/types/database";

export interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  role: AppRole;
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const { rows } = await query(
    `SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1`,
    [email.toLowerCase().trim()]
  );
  return rows[0] ?? null;
}

export async function findUserById(id: string): Promise<Omit<DbUser, "password_hash"> | null> {
  const { rows } = await query(
    `SELECT id, email, full_name, role, created_at, updated_at FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] as Omit<DbUser, "password_hash"> | null;
}

export async function getReconciliation(opts: {
  sessionId?: string;
  q?: string;
  filter?: string;
}): Promise<ReconciliationRow[]> {
  const { sessionId, q, filter } = opts;

  if (sessionId) {
    let sql = `SELECT * FROM session_reconciliation WHERE session_id = $1`;
    const params: unknown[] = [sessionId];
    let n = 2;

    if (q) {
      sql += ` AND (description ILIKE $${n} OR barcode ILIKE $${n} OR clave ILIKE $${n})`;
      params.push(`%${q}%`);
      n++;
    }
    if (filter === "missing") sql += ` AND missing_quantity > 0`;
    if (filter === "found") sql += ` AND found_quantity > 0`;
    sql += ` ORDER BY missing_quantity DESC LIMIT 500`;

    const { rows } = await query(sql, params);
    return rows.map((r: Record<string, unknown>) => ({
      ...r,
      id: (r.id ?? r.item_id) as string,
    })) as ReconciliationRow[];
  }

  let sql = `SELECT * FROM inventory_reconciliation WHERE 1=1`;
  const params: unknown[] = [];
  let n = 1;

  if (q) {
    sql += ` AND (description ILIKE $${n} OR barcode ILIKE $${n} OR clave ILIKE $${n} OR responsible_person ILIKE $${n})`;
    params.push(`%${q}%`);
    n++;
  }
  if (filter === "missing") sql += ` AND missing_quantity > 0`;
  sql += ` ORDER BY missing_quantity DESC LIMIT 500`;

  const { rows } = await query(sql, params);
  return rows as ReconciliationRow[];
}

export async function getInventorySession(): Promise<InventorySession> {
  const { rows } = await query(
    `SELECT * FROM inventory_sessions WHERE id = $1`,
    [INVENTORY_SESSION_ID]
  );
  if (rows[0]) return rows[0] as InventorySession;
  const { rows: created } = await query(
    `INSERT INTO inventory_sessions (id, name, description, status, started_at)
     VALUES ($1, 'Inventario Biblioteca', 'Inventario patrimonial UACH', 'active', NOW())
     RETURNING *`,
    [INVENTORY_SESSION_ID]
  );
  return created[0] as InventorySession;
}

export async function processScan(opts: {
  sessionId: string;
  barcode: string;
  scannedBy: string;
  deviceId?: string;
  forceOverride?: boolean;
}) {
  const { rows } = await query(
    `SELECT process_scan($1::uuid, $2, $3::uuid, $4, $5) AS process_scan`,
    [
      opts.sessionId,
      opts.barcode,
      opts.scannedBy,
      opts.deviceId ?? null,
      opts.forceOverride ?? false,
    ]
  );
  return rows[0].process_scan;
}

export async function insertLog(opts: {
  action: string;
  entity_type: string;
  user_id: string;
  payload?: unknown;
}) {
  await query(
    `INSERT INTO inventory_logs (action, entity_type, user_id, payload) VALUES ($1, $2, $3, $4)`,
    [opts.action, opts.entity_type, opts.user_id, JSON.stringify(opts.payload ?? {})]
  );
}

export async function upsertInventoryItems(
  items: Record<string, unknown>[]
): Promise<{ imported: number; errors: string[] }> {
  let imported = 0;
  const errors: string[] = [];

  for (const item of items) {
    try {
      await query(
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
          item.status,
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
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  return { imported, errors };
}

export async function recordImport(opts: {
  filename: string;
  row_count: number;
  imported_count: number;
  skipped_count: number;
  error_count: number;
  column_mapping: unknown;
  errors: unknown;
  imported_by: string;
}) {
  await query(
    `INSERT INTO inventory_imports (
      filename, row_count, imported_count, skipped_count, error_count,
      column_mapping, errors, imported_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      opts.filename,
      opts.row_count,
      opts.imported_count,
      opts.skipped_count,
      opts.error_count,
      JSON.stringify(opts.column_mapping),
      JSON.stringify(opts.errors),
      opts.imported_by,
    ]
  );
}
