import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { ScanProcessResult } from "@/types/database";

export interface PendingScan {
  id: string;
  sessionId: string;
  barcode: string;
  forceOverride: boolean;
  createdAt: number;
  retries: number;
}

export interface CachedItem {
  id: string;
  barcode: string;
  clave: string;
  description: string;
  expected_quantity: number;
  found_quantity: number;
  updatedAt: number;
}

interface BiblioScanDB extends DBSchema {
  pending_scans: {
    key: string;
    value: PendingScan;
    indexes: { "by-session": string };
  };
  cached_items: {
    key: string;
    value: CachedItem;
  };
  meta: {
    key: string;
    value: { key: string; value: string };
  };
}

const DB_NAME = "biblioscan-offline";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<BiblioScanDB>> | null = null;

export function getOfflineDB() {
  if (!dbPromise) {
    dbPromise = openDB<BiblioScanDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const scans = db.createObjectStore("pending_scans", { keyPath: "id" });
        scans.createIndex("by-session", "sessionId");
        db.createObjectStore("cached_items", { keyPath: "id" });
        db.createObjectStore("meta");
      },
    });
  }
  return dbPromise;
}

export async function queueScan(scan: Omit<PendingScan, "id" | "createdAt" | "retries">) {
  const db = await getOfflineDB();
  const entry: PendingScan = {
    ...scan,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    retries: 0,
  };
  await db.add("pending_scans", entry);
  return entry;
}

export async function getPendingScans(sessionId?: string) {
  const db = await getOfflineDB();
  if (sessionId) {
    return db.getAllFromIndex("pending_scans", "by-session", sessionId);
  }
  return db.getAll("pending_scans");
}

export async function removePendingScan(id: string) {
  const db = await getOfflineDB();
  await db.delete("pending_scans", id);
}

export async function setMeta(key: string, value: string) {
  const db = await getOfflineDB();
  await db.put("meta", { key, value });
}

export async function getMeta(key: string) {
  const db = await getOfflineDB();
  const row = await db.get("meta", key);
  return row?.value;
}

export async function cacheItems(items: CachedItem[]) {
  const db = await getOfflineDB();
  const tx = db.transaction("cached_items", "readwrite");
  await Promise.all(items.map((item) => tx.store.put(item)));
  await tx.done;
}

export async function findCachedByBarcode(barcode: string): Promise<CachedItem | undefined> {
  const db = await getOfflineDB();
  const all = await db.getAll("cached_items");
  const key = barcode.replace(/\s+/g, "").toUpperCase();
  return all.find(
    (i) =>
      i.barcode.replace(/\s+/g, "").toUpperCase() === key ||
      i.clave.replace(/\s+/g, "").toUpperCase() === key
  );
}

export type OfflineScanResult = ScanProcessResult & { offline?: boolean };
