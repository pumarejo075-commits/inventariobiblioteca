import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "biblioscan",
    timestamp: new Date().toISOString(),
  });
}
