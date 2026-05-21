import { NextResponse } from "next/server";
import { getRecentScans } from "@/lib/db/queries";
import { INVENTORY_SESSION_ID } from "@/lib/inventory/constants";
import { isDevMode } from "@/lib/dev/mock-data";

export async function GET() {
  if (isDevMode()) {
    return NextResponse.json([]);
  }

  try {
    const limit = 25;
    const rows = await getRecentScans(INVENTORY_SESSION_ID, limit);
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}
