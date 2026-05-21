import { NextResponse } from "next/server";
import { getInventorySession } from "@/lib/db/queries";
import { isDevMode } from "@/lib/dev/mock-data";
import { INVENTORY_SESSION_ID, INVENTORY_SESSION_NAME } from "@/lib/inventory/constants";

/** El inventario no se cierra — siempre activo */
export async function POST() {
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
