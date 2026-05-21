import type { InventorySession } from "@/types/database";

/** Sesión de inventario creada en migración 003 / seed UACH */
export const DEFAULT_INVENTORY_SESSION_ID = "a0000000-0000-4000-8000-000000000001";

export const DEFAULT_INVENTORY_SESSION: InventorySession = {
  id: DEFAULT_INVENTORY_SESSION_ID,
  name: "Inventario Biblioteca",
  description: "Inventario patrimonial UACH",
  status: "active",
  location_filter: null,
  started_at: new Date().toISOString(),
  closed_at: null,
  created_by: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export async function resolveActiveInventorySession(): Promise<InventorySession> {
  try {
    const res = await fetch("/api/sessions");
    if (!res.ok) return DEFAULT_INVENTORY_SESSION;
    const sessions: InventorySession[] = await res.json();
    const preferredActive = sessions.find(
      (s) => s.id === DEFAULT_INVENTORY_SESSION_ID && s.status === "active"
    );
    const anyActive = sessions.find((s) => s.status === "active");
    return preferredActive ?? anyActive ?? DEFAULT_INVENTORY_SESSION;
  } catch {
    return DEFAULT_INVENTORY_SESSION;
  }
}
