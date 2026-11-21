import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { gatewayMembers } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
const uuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
function response(code: string, message: string, status: number) { return NextResponse.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } }); }

async function ownerOrAdmin(request: Request, gatewayId: string) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) return { response: response("UNAUTHENTICATED", "Sign in to manage devices.", 401) };
  if (!uuid(gatewayId)) return { response: response("INVALID_GATEWAY", "Invalid gateway identifier.", 400) };
  const db = getDb();
  const [member] = await db.select({ permission: gatewayMembers.permission }).from(gatewayMembers)
    .where(and(eq(gatewayMembers.gatewayId, gatewayId), eq(gatewayMembers.userId, session.user.id))).limit(1);
  if (!member || !["owner", "admin"].includes(member.permission)) return { response: response("FORBIDDEN", "Only gateway owners and admins can manage devices.", 403) };
  return { db, session };
}

export async function PATCH(request: Request, context: { params: Promise<{ gatewayId: string; deviceId: string }> }) {
  try {
    const { gatewayId, deviceId } = await context.params;
    const access = await ownerOrAdmin(request, gatewayId);
    if ("response" in access) return access.response;
    if (!uuid(deviceId)) return response("INVALID_DEVICE", "Invalid device identifier.", 400);
    let body: unknown;
    try { body = await request.json(); } catch { return response("INVALID_JSON", "Send a valid JSON object.", 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return response("INVALID_BODY", "Send a JSON object.", 400);
    const input = body as Record<string, unknown>;
    if (Object.keys(input).length !== 1 || typeof input.name !== "string" || input.name.trim().length < 1 || input.name.trim().length > 80) return response("INVALID_NAME", "Provide only a device name between 1 and 80 characters.", 400);
    const result = await access.db.execute(sql`UPDATE rig_device_identities SET device_name = ${input.name.trim()} WHERE id = ${deviceId} AND gateway_id = ${gatewayId} AND status = 'active' RETURNING id, device_name AS name, status`);
    const device = result.rows[0];
    if (!device) return response("NOT_FOUND", "Active device not found.", 404);
    await access.db.execute(sql`INSERT INTO rig_audit_events (actor_user_id, action, resource_type, resource_id, metadata) VALUES (${access.session.user.id}, 'gateway.device.renamed', 'device', ${deviceId}, '{}'::jsonb)`);
    return NextResponse.json({ data: device }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("RIG device update error", cause);
    return response("SERVICE_UNAVAILABLE", "Device service is unavailable.", 503);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ gatewayId: string; deviceId: string }> }) {
  try {
    const { gatewayId, deviceId } = await context.params;
    const access = await ownerOrAdmin(request, gatewayId);
    if ("response" in access) return access.response;
    if (!uuid(deviceId)) return response("INVALID_DEVICE", "Invalid device identifier.", 400);
    const result = await access.db.execute(sql`UPDATE rig_device_identities SET status = 'revoked', revoked_at = now() WHERE id = ${deviceId} AND gateway_id = ${gatewayId} AND status = 'active' RETURNING id`);
    if (result.rows.length === 0) return response("NOT_FOUND", "Active device not found.", 404);
    await access.db.execute(sql`INSERT INTO rig_audit_events (actor_user_id, action, resource_type, resource_id, metadata) VALUES (${access.session.user.id}, 'gateway.device.revoked', 'device', ${deviceId}, '{}'::jsonb)`);
    return NextResponse.json({ data: { deviceId, revoked: true } }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("RIG device revocation error", cause);
    return response("SERVICE_UNAVAILABLE", "Device service is unavailable.", 503);
  }
}
