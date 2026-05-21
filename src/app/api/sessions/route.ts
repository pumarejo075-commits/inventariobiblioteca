import { NextResponse } from "next/server";
import { getInventorySession } from "@/lib/db/queries";
import { INVENTORY_SESSION_ID, INVENTORY_SESSION_NAME } from "@/lib/inventory/constants";
import { isDevMode } from "@/lib/dev/mock-data";

/** Inventario único — solo lectura del registro interno */
export async function GET() {
  if (isDevMode()) {
    return NextResponse.json({
      id: INVENTORY_SESSION_ID,
      name: INVENTORY_SESSION_NAME,
      status: "active",
    });
  }

  try {
    const session = await getInventorySession();
    return NextResponse.json(session);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: "Solo existe un inventario; no se pueden crear sesiones" },
    { status: 405 }
  );
}
