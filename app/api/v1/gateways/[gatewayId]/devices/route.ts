import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { gatewayMembers } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
function uuid(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }

export async function GET(request: Request, context: { params: Promise<{ gatewayId: string }> }) {
  try {
    const session = await getAuth().api.getSession({ headers: request.headers });
    if (!session) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Sign in to view devices." } }, { status: 401 });
    const { gatewayId } = await context.params;
    if (!uuid(gatewayId)) return NextResponse.json({ error: { code: "INVALID_GATEWAY", message: "Invalid gateway identifier." } }, { status: 400 });
    const db = getDb();
    const [member] = await db.select({ permission: gatewayMembers.permission }).from(gatewayMembers).where(and(eq(gatewayMembers.gatewayId, gatewayId), eq(gatewayMembers.userId, session.user.id))).limit(1);
    if (!member) return NextResponse.json({ error: { code: "FORBIDDEN", message: "You do not have access to this gateway." } }, { status: 403 });
    const result = await db.execute(`SELECT id, device_name AS name, status, last_seen_at AS "lastSeenAt", created_at AS "createdAt" FROM rig_device_identities WHERE gateway_id = $1 AND status <> 'revoked' ORDER BY created_at DESC`, [gatewayId]);
    return NextResponse.json({ data: result.rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("RIG device list error", cause);
    return NextResponse.json({ error: { code: "SERVICE_UNAVAILABLE", message: "Device service is unavailable." } }, { status: 503 });
  }
}
