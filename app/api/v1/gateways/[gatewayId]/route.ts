import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, context: { params: Promise<{ gatewayId: string }> }) {
  try {
    const session = await getAuth().api.getSession({ headers: request.headers });
    if (!session) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Sign in to manage gateways." } }, { status: 401 });
    const { gatewayId } = await context.params;

    if (!/^\d+$/.test(gatewayId) && !/^[0-9a-f-]{36}$/i.test(gatewayId)) {
      return NextResponse.json({ error: { code: "INVALID_GATEWAY", message: "Invalid gateway identifier." } }, { status: 400 });
    }

    const db = getDb();
    const member = await db.execute(
      `SELECT permission FROM rig_gateway_members WHERE gateway_id = $1 AND user_id = $2 LIMIT 1`,
      [gatewayId, session.user.id]
    );
    if (member.rows.length === 0) return NextResponse.json({ error: { code: "FORBIDDEN", message: "You do not have access to this gateway." } }, { status: 403 });

    await db.execute(`DELETE FROM rig_gateways WHERE id = $1`, [gatewayId]);
    return NextResponse.json({ data: { gatewayId, deleted: true } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("RIG gateway deletion error", error);
    return NextResponse.json({ error: { code: "SERVICE_UNAVAILABLE", message: "Gateway management is unavailable." } }, { status: 503 });
  }
}
