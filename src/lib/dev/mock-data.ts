import type { InventorySession, ReconciliationRow, ScanProcessResult } from "@/types/database";

export const MOCK_SESSION: InventorySession = {
  id: "a0000000-0000-4000-8000-000000000001",
  name: "Inventario Biblioteca",
  description: "Demo local — Biblioteca",
  status: "active",
  location_filter: null,
  started_at: new Date().toISOString(),
  closed_at: null,
  created_by: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const MOCK_ITEMS: ReconciliationRow[] = [
  {
    id: "1",
    barcode: "22730531370000010001",
    clave: "227 3053 137 000001 0001",
    description: "MESA PARA COMPUTADORA",
    brand: "S/M",
    model: "1.60X.60X.75MTS",
    location: "BIBLIOTECA DES DE LA SALUD",
    responsible_person: "TARIN MADRID HIATLAY",
    expected_quantity: 34,
    found_quantity: 12,
    missing_quantity: 22,
    excess_quantity: 0,
    reconciliation_percent: 35.29,
    is_group: false,
    status: "active",
  },
  {
    id: "2",
    barcode: "DELL-LAPTOP-001",
    clave: "DELL-LAPTOP-001",
    description: "COMPUTADORA DELL",
    brand: "DELL",
    model: "Latitude 5420",
    location: "Sala de cómputo",
    responsible_person: "Juan Pérez",
    expected_quantity: 20,
    found_quantity: 17,
    missing_quantity: 3,
    excess_quantity: 0,
    reconciliation_percent: 85,
    is_group: false,
    status: "active",
  },
  {
    id: "3",
    barcode: "SILLA-MADERA-001",
    clave: "SILLA-MADERA-001",
    description: "SILLA MADERA",
    brand: "Institucional",
    model: "Estándar",
    location: "Piso 2",
    responsible_person: "María López",
    expected_quantity: 20,
    found_quantity: 20,
    missing_quantity: 0,
    excess_quantity: 0,
    reconciliation_percent: 100,
    is_group: false,
    status: "active",
  },
];

export function isDevMode() {
  return (
    process.env.BIBLIOSCAN_DEV_MODE === "true" ||
    process.env.NEXT_PUBLIC_BIBLIOSCAN_DEV_MODE === "true"
  );
}

export function mockProcessScan(barcode: string): ScanProcessResult {
  const key = barcode.trim();
  const item = MOCK_ITEMS.find(
    (i) =>
      i.barcode === key.replace(/\s+/g, "") ||
      i.clave === key ||
      i.barcode.includes(key.replace(/\s+/g, ""))
  );

  if (!item) {
    return { result: "not_found", message: "Activo no registrado (demo)" };
  }

  item.found_quantity += 1;
  item.missing_quantity = Math.max(item.expected_quantity - item.found_quantity, 0);
  item.excess_quantity = Math.max(item.found_quantity - item.expected_quantity, 0);
  item.reconciliation_percent =
    item.expected_quantity > 0
      ? Math.round((item.found_quantity / item.expected_quantity) * 10000) / 100
      : 0;

  return {
    result: "found",
    item: {
      id: item.id,
      barcode: item.barcode,
      clave: item.clave,
      description: item.description,
      brand: item.brand,
      model: item.model,
      expected_quantity: item.expected_quantity,
      found_quantity: item.found_quantity,
      missing_quantity: item.missing_quantity,
      excess_quantity: item.excess_quantity,
    },
  };
}
