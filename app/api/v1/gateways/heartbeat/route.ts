import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { allowRequest } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(authorization);
    if (!match) return NextResponse.json({ error: { code: "UNAUTHENTICATED_DEVICE", message: "A valid gateway credential is required." } }, { status: 401 });
    const credentialHash = createHash("sha256").update(match[1]).digest("hex");
    const db = getDb();
    if (!await allowRequest(db, "gateway-heartbeat", credentialHash, 120, 60)) return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Heartbeat rate limit exceeded." } }, { status: 429, headers: { "Retry-After": "60" } });
    const result = await db.execute(sql`
      WITH heartbeat AS (
        UPDATE rig_device_identities SET last_seen_at = now()
        WHERE credential_hash = ${credentialHash} AND status = 'active' RETURNING gateway_id
      )
      UPDATE rig_gateways AS gateway SET status = 'online', last_seen_at = now(), updated_at = now()
      FROM heartbeat WHERE gateway.id = heartbeat.gateway_id
      RETURNING gateway.id, gateway.status, gateway.last_seen_at
    `);
    const gateway = result.rows[0] as { id: string; status: string; last_seen_at: Date } | undefined;
    if (!gateway) return NextResponse.json({ error: { code: "UNAUTHENTICATED_DEVICE", message: "The gateway credential is invalid or revoked." } }, { status: 401 });
    return NextResponse.json({ data: { gatewayId: gateway.id, status: gateway.status, lastSeenAt: gateway.last_seen_at } }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("RIG gateway heartbeat error", cause);
    return NextResponse.json({ error: { code: "SERVICE_UNAVAILABLE", message: "Gateway heartbeat is unavailable." } }, { status: 503 });
  }
}
