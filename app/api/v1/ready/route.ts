import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getDb().execute(sql`select 1`);
    return NextResponse.json({ status: "ready", service: "rig-api", database: "reachable" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "not_ready", service: "rig-api", database: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
