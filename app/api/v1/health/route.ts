import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Liveness probe only; readiness/database checks are deliberately separate. */
export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "rig-api",
      apiVersion: "v1",
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
