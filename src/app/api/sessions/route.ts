import { NextRequest, NextResponse } from "next/server";
import { getSession, canWrite } from "@/lib/auth/session";
import { listSessions, createSession } from "@/lib/db/queries";
import { isDevMode, MOCK_SESSION } from "@/lib/dev/mock-data";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().optional(),
  location_filter: z.string().optional(),
});

export async function GET() {
  if (isDevMode()) return NextResponse.json([MOCK_SESSION]);

  try {
    return NextResponse.json(await listSessions());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session && !isDevMode()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (isDevMode()) {
    return NextResponse.json({ ...MOCK_SESSION, name: parsed.data.name });
  }

  if (!canWrite(session!.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const created = await createSession(parsed.data, session!.sub);
    return NextResponse.json(created);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}
