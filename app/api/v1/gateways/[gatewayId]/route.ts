import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { gatewayMembers, gateways } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

function error(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}

function validId(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

async function getOwner(request: Request, gatewayId: string) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) return { response: error("UNAUTHENTICATED", "Sign in to manage gateways.", 401) };
  if (!validId(gatewayId)) return { response: error("INVALID_GATEWAY", "Invalid gateway identifier.", 400) };

  const db = getDb();
  const [membership] = await db.select({ permission: gatewayMembers.permission })
    .from(gatewayMembers)
    .where(and(eq(gatewayMembers.gatewayId, gatewayId), eq(gatewayMembers.userId, session.user.id)))
    .limit(1);
  if (!membership || membership.permission !== "owner") {
    return { response: error("FORBIDDEN", "Only a gateway owner can perform this action.", 403) };
  }
  return { db };
}

export async function PATCH(request: Request, context: { params: Promise<{ gatewayId: string }> }) {
  try {
    const { gatewayId } = await context.params;
    const access = await getOwner(request, gatewayId);
    if ("response" in access) return access.response;

    let body: unknown;
    try { body = await request.json(); } catch { return error("INVALID_JSON", "Send a valid JSON object.", 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return error("INVALID_BODY", "Send a JSON object.", 400);
    const input = body as Record<string, unknown>;
    if (Object.keys(input).length !== 1 || typeof input.name !== "string") return error("INVALID_FIELDS", "Only the gateway name can be changed.", 400);
    const name = input.name.trim();
    if (name.length < 2 || name.length > 80) return error("INVALID_NAME", "Gateway name must be between 2 and 80 characters.", 400);

    const [gateway] = await access.db.update(gateways)
      .set({ name, updatedAt: new Date() })
      .where(eq(gateways.id, gatewayId))
      .returning({ id: gateways.id, name: gateways.name, status: gateways.status });
    if (!gateway) return error("NOT_FOUND", "Gateway not found.", 404);
    return NextResponse.json({ data: gateway }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("RIG gateway update error", cause);
    return error("SERVICE_UNAVAILABLE", "Gateway management is unavailable.", 503);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ gatewayId: string }> }) {
  try {
    const { gatewayId } = await context.params;
    const access = await getOwner(request, gatewayId);
    if ("response" in access) return access.response;

    const [deleted] = await access.db.delete(gateways).where(eq(gateways.id, gatewayId)).returning({ id: gateways.id });
    if (!deleted) return error("NOT_FOUND", "Gateway not found.", 404);
    return NextResponse.json({ data: { gatewayId: deleted.id, deleted: true } }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("RIG gateway deletion error", cause);
    return error("SERVICE_UNAVAILABLE", "Gateway management is unavailable.", 503);
  }
}
