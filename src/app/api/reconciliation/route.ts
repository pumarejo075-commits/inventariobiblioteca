import { NextRequest, NextResponse } from "next/server";
import { getReconciliation } from "@/lib/db/queries";
import { INVENTORY_SESSION_ID } from "@/lib/inventory/constants";
import { isDevMode, MOCK_ITEMS } from "@/lib/dev/mock-data";

export async function GET(request: NextRequest) {
  if (isDevMode()) {
    const q = request.nextUrl.searchParams.get("q")?.toLowerCase();
    const filter = request.nextUrl.searchParams.get("filter");
    let rows = [...MOCK_ITEMS];
    if (q) {
      rows = rows.filter(
        (r) =>
          r.description.toLowerCase().includes(q) ||
          r.clave.toLowerCase().includes(q) ||
          r.barcode.toLowerCase().includes(q)
      );
    }
    if (filter === "missing") rows = rows.filter((r) => r.missing_quantity > 0);
    if (filter === "found") rows = rows.filter((r) => r.found_quantity > 0);
    return NextResponse.json(rows);
  }

  try {
    const data = await getReconciliation({
      sessionId: INVENTORY_SESSION_ID,
      q: request.nextUrl.searchParams.get("q")?.trim(),
      filter: request.nextUrl.searchParams.get("filter") ?? undefined,
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}
