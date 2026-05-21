import { NextRequest, NextResponse } from "next/server";
import { getSession, canWrite } from "@/lib/auth/session";
import { upsertInventoryItems, recordImport } from "@/lib/db/queries";
import { parseExcelFile, rowsToInventoryPayload } from "@/lib/excel/parser";
import { isDevMode } from "@/lib/dev/mock-data";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session && !isDevMode()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session && !canWrite(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const confirm = formData.get("confirm") === "true";
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const buffer = await file.arrayBuffer();
  const preview = parseExcelFile(buffer);

  if (!confirm) {
    return NextResponse.json({
      preview: true,
      rowCount: preview.rows.length,
      errors: preview.errors,
      duplicates: preview.duplicates,
      mapping: preview.mapping,
      sample: preview.rows.slice(0, 5),
    });
  }

  if (isDevMode()) {
    return NextResponse.json({
      imported: preview.rows.length,
      skipped: 0,
      errors: preview.errors,
      message: "Modo demo — sin base de datos",
    });
  }

  const payload = rowsToInventoryPayload(preview.rows);
  const { imported, errors: batchErrors } = await upsertInventoryItems(payload);

  await recordImport({
    filename: file.name,
    row_count: preview.rows.length,
    imported_count: imported,
    skipped_count: payload.length - imported,
    error_count: batchErrors.length + preview.errors.length,
    column_mapping: preview.mapping,
    errors: [...preview.errors, ...batchErrors],
    imported_by: session!.sub,
  });

  return NextResponse.json({
    imported,
    skipped: payload.length - imported,
    errors: [...preview.errors, ...batchErrors.map((m) => ({ message: m }))],
  });
}
