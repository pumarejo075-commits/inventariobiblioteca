export type AppRole = "admin" | "operator" | "viewer";
export type ScanResult = "found" | "duplicate" | "not_found" | "group_reconciled";
export type SessionStatus = "draft" | "active" | "closed";
export type AssetStatus = "active" | "inactive" | "disposed" | "maintenance";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  barcode: string;
  clave: string;
  resguardo: string | null;
  description: string;
  brand: string | null;
  model: string | null;
  serial: string | null;
  status: AssetStatus;
  invoice_number: string | null;
  invoice_date: string | null;
  depreciated_cost: number | null;
  responsible_person: string | null;
  location: string | null;
  expected_quantity: number;
  found_quantity: number;
  is_group: boolean;
  category_id: string | null;
  location_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ReconciliationRow {
  id: string;
  barcode: string;
  clave: string;
  description: string;
  brand: string | null;
  model: string | null;
  location: string | null;
  responsible_person: string | null;
  expected_quantity: number;
  found_quantity: number;
  missing_quantity: number;
  excess_quantity: number;
  reconciliation_percent: number;
  is_group: boolean;
  status: AssetStatus;
}

export interface InventorySession {
  id: string;
  name: string;
  description: string | null;
  status: SessionStatus;
  location_filter: string | null;
  started_at: string | null;
  closed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryScan {
  id: string;
  session_id: string;
  item_id: string | null;
  barcode: string;
  result: ScanResult;
  quantity: number;
  scanned_by: string | null;
  device_id: string | null;
  is_override: boolean;
  notes: string | null;
  scanned_at: string;
}

export interface RecentScanRow {
  id: string;
  barcode: string;
  result: ScanResult;
  scanned_at: string;
  description: string | null;
  clave: string | null;
  expected_quantity: number | null;
  found_quantity: number | null;
}

export interface ScanProcessResult {
  result: ScanResult | "not_found";
  message?: string;
  barcode?: string;
  item?: {
    id: string;
    barcode: string;
    clave: string;
    description: string;
    brand: string | null;
    model: string | null;
    expected_quantity: number;
    found_quantity: number;
    missing_quantity: number;
    excess_quantity: number;
  };
}

export interface SessionStats {
  total_expected: number;
  total_found: number;
  total_missing: number;
  items_count: number;
  scans_count: number;
  reconciliation_percent: number;
}

export const EXCEL_COLUMN_MAP = {
  clave: ["clave", "código", "codigo", "barcode", "codigo de barras"],
  resguardo: ["resguardo"],
  cantidadAlta: ["cantidadalta", "cantidad alta", "alta"],
  cantidadExiste: ["cantidadexiste", "cantidad existe", "cantidad", "expected"],
  descCorta: ["desccorta", "desc corta", "descripcion", "descripción", "description"],
  marca: ["marca", "brand"],
  modelo: ["modelo", "model"],
  serie: ["serie", "serial"],
  status: ["status", "estado"],
  Factura: ["factura", "invoice"],
  FechaFactura: ["fechafactura", "fecha factura"],
  CostoDepreciado: ["costodepreciado", "costo"],
  Responsable: ["responsable", "responsible"],
  Ubicación: ["ubicación", "ubicacion", "location", "ubicacion"],
} as const;

export type ExcelField = keyof typeof EXCEL_COLUMN_MAP;
