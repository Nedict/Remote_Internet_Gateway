import { NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { normalizeEnrollmentCode, secureCodeMatch } from "@/lib/gateway-enrollment";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getAuth().api.getSession({ headers: request.headers });
    if (!session) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Sign in to claim a gateway." } }, { status: 401 });

    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: { code: "INVALID_JSON", message: "Send a valid JSON object." } }, { status: 400 }); }
    if (!body || typeof body !== "object") return NextResponse.json({ error: { code: "INVALID_BODY", message: "Send a JSON object." } }, { status: 400 });

    const normalized = normalizeEnrollmentCode((body as { code?: unknown }).code);
    if (!normalized) return NextResponse.json({ error: { code: "INVALID_CODE", message: "Enter a valid 12-character setup code." } }, { status: 400 });

    const db = getDb();
    const rows = await db.execute<{ id: string; gateway_id: string; code_hash: string; status: string; expires_at: Date }>(
      `SELECT id, gateway_id, code_hash, status, expires_at
       FROM rig_gateway_enrollments
       WHERE status = 'pending' AND expires_at > now()
       LIMIT 100`
    );

    const enrollment = rows.rows.find((row) => secureCodeMatch(row.code_hash, normalized));
    if (!enrollment) return NextResponse.json({ error: { code: "INVALID_OR_EXPIRED_CODE", message: "That setup code is invalid or has expired." } }, { status: 404 });

    await db.execute(
      `UPDATE rig_gateway_enrollments
       SET status = 'consumed', consumed_at = now(), consumed_by = $1
       WHERE id = $2 AND status = 'pending' AND expires_at > now()`,
      [session.user.id, enrollment.id]
    );
    await db.execute(
      `UPDATE rig_gateways SET status = 'online', updated_at = now() WHERE id = $1`,
      [enrollment.gateway_id]
    );

    return NextResponse.json({ data: { gatewayId: enrollment.gateway_id, status: "claimed" } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("RIG gateway claim error", error);
    return NextResponse.json({ error: { code: "SERVICE_UNAVAILABLE", message: "Gateway claiming is unavailable." } }, { status: 503 });
  }
}
