import { NextRequest, NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/auth/session";
import { processScan, insertLog } from "@/lib/db/queries";
import { isDevMode, mockProcessScan } from "@/lib/dev/mock-data";
import { z } from "zod";

const scanSchema = z.object({
  sessionId: z.string().uuid(),
  barcode: z.string().min(1).max(200),
  forceOverride: z.boolean().optional().default(false),
  deviceId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session && !isDevMode()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = scanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { sessionId, barcode, forceOverride, deviceId } = parsed.data;

  if (isDevMode()) {
    return NextResponse.json(mockProcessScan(barcode));
  }

  if (forceOverride && !isAdmin(session!.role)) {
    return NextResponse.json({ error: "Admin required for override" }, { status: 403 });
  }

  try {
    const data = await processScan({
      sessionId,
      barcode,
      scannedBy: session!.sub,
      deviceId,
      forceOverride,
    });

    await insertLog({
      action: "scan",
      entity_type: "inventory_scans",
      user_id: session!.sub,
      payload: { sessionId, barcode, result: data },
    });

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Scan failed" },
      { status: 500 }
    );
  }
}
