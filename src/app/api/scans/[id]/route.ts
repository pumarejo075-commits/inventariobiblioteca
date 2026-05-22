import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { undoScan, insertLog } from "@/lib/db/queries";
import { isDevMode, mockUndoScan } from "@/lib/dev/mock-data";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session && !isDevMode()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  if (isDevMode()) {
    const result = mockUndoScan(id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  try {
    const result = await undoScan(id);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? "Escaneo no encontrado" },
        { status: 404 }
      );
    }

    await insertLog({
      action: "undo_scan",
      entity_type: "inventory_scans",
      user_id: session!.sub,
      payload: { scanId: id },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al eliminar" },
      { status: 500 }
    );
  }
}
