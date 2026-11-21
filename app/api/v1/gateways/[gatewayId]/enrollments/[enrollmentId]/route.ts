import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { gatewayMembers } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, context: { params: Promise<{ gatewayId: string; enrollmentId: string }> }) {
  try {
    const session = await getAuth().api.getSession({ headers: request.headers });
    if (!session) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Sign in to manage enrollment codes." } }, { status: 401 });
    const { gatewayId, enrollmentId } = await context.params;
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(gatewayId) || !uuidPattern.test(enrollmentId)) return NextResponse.json({ error: { code: "INVALID_ID", message: "Invalid gateway or enrollment identifier." } }, { status: 400 });

    const db = getDb();
    const [owner] = await db.select({ gatewayId: gatewayMembers.gatewayId }).from(gatewayMembers)
      .where(and(eq(gatewayMembers.gatewayId, gatewayId), eq(gatewayMembers.userId, session.user.id), eq(gatewayMembers.permission, "owner"))).limit(1);
    if (!owner) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Only a gateway owner can revoke setup codes." } }, { status: 403 });

    const result = await db.execute(
      `UPDATE rig_gateway_enrollments SET status = 'revoked'
       WHERE id = $1 AND gateway_id = $2 AND status = 'pending'
       RETURNING id`,
      [enrollmentId, gatewayId]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Pending enrollment was not found." } }, { status: 404 });
    return NextResponse.json({ data: { enrollmentId, revoked: true } }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("RIG enrollment revocation error", cause);
    return NextResponse.json({ error: { code: "SERVICE_UNAVAILABLE", message: "Enrollment management is unavailable." } }, { status: 503 });
  }
}
