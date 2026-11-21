import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { generateEnrollmentCode, hashEnrollmentCode } from "@/lib/gateway-enrollment";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getAuth().api.getSession({ headers: request.headers });
    if (!session) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Sign in to enroll a gateway." } }, { status: 401 });

    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: { code: "INVALID_JSON", message: "Send a valid JSON object." } }, { status: 400 }); }
    if (!body || typeof body !== "object") return NextResponse.json({ error: { code: "INVALID_BODY", message: "Send a JSON object." } }, { status: 400 });
    const { name } = body as { name?: unknown };
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80) {
      return NextResponse.json({ error: { code: "INVALID_NAME", message: "Gateway name must be between 2 and 80 characters." } }, { status: 400 });
    }

    const code = generateEnrollmentCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const db = getDb();
    const result = await db.execute(sql`
      WITH created_gateway AS (
        INSERT INTO rig_gateways (name, status)
        VALUES (${name.trim()}, 'pending')
        RETURNING id
      ), added_membership AS (
        INSERT INTO rig_gateway_members (gateway_id, user_id, permission)
        SELECT id, ${session.user.id}, 'owner'
        FROM created_gateway
        RETURNING gateway_id
      )
      INSERT INTO rig_gateway_enrollments (gateway_id, code_hash, expires_at)
      SELECT gateway_id, ${hashEnrollmentCode(code)}, ${expiresAt}
      FROM added_membership
      RETURNING gateway_id, id
    `);
    const row = result.rows[0] as { gateway_id: string; id: string } | undefined;
    if (!row) throw new Error("Enrollment transaction returned no gateway");

    return NextResponse.json({ data: { gatewayId: row.gateway_id, enrollmentId: row.id, code, expiresAt: expiresAt.toISOString() } }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("RIG gateway enrollment error", error);
    return NextResponse.json({ error: { code: "SERVICE_UNAVAILABLE", message: "Gateway enrollment is unavailable." } }, { status: 503 });
  }
}
