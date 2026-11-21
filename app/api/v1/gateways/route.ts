import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { gatewayMembers, gateways } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getAuth().api.getSession({ headers: request.headers });
    if (!session) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Sign in to view gateways." } }, { status: 401 });
    const rows = await getDb().select({ id: gateways.id, name: gateways.name, status: gateways.status, lastSeenAt: gateways.lastSeenAt, permission: gatewayMembers.permission }).from(gatewayMembers).innerJoin(gateways, eq(gatewayMembers.gatewayId, gateways.id)).where(eq(gatewayMembers.userId, session.user.id)).orderBy(desc(gateways.createdAt));
    return NextResponse.json({ data: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("RIG gateways API error", error);
    return NextResponse.json({ error: { code: "SERVICE_UNAVAILABLE", message: "Gateway service is not configured." } }, { status: 503 });
  }
}
