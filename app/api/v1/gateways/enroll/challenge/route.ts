import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { hashEnrollmentCode, hashSecret, normalizeEnrollmentCode } from "@/lib/gateway-enrollment";
import { allowRequest, requestSource } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const db = getDb();
    if (!await allowRequest(db, "enrollment-challenge", requestSource(request), 20, 60)) {
      return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Too many enrollment attempts. Try again shortly." } }, { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } });
    }
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: { code: "INVALID_JSON", message: "Send a valid JSON object." } }, { status: 400 }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: { code: "INVALID_BODY", message: "Send a JSON object." } }, { status: 400 });
    const code = normalizeEnrollmentCode((body as { code?: unknown }).code);
    if (!code) return NextResponse.json({ error: { code: "INVALID_CODE", message: "Enter a valid setup code." } }, { status: 400 });

    const nonce = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const result = await db.execute(sql`
      UPDATE rig_gateway_enrollments
      SET challenge_hash = ${hashSecret(nonce)}, challenge_expires_at = ${expiresAt}, attempts = attempts + 1
      WHERE code_hash = ${hashEnrollmentCode(code)}
        AND status = 'pending' AND expires_at > now() AND attempts < 5
      RETURNING id
    `);
    const enrollment = result.rows[0] as { id: string } | undefined;
    if (!enrollment) return NextResponse.json({ error: { code: "INVALID_OR_EXPIRED_CODE", message: "That setup code is invalid, expired, or has reached its attempt limit." } }, { status: 404 });
    return NextResponse.json({ data: { enrollmentId: enrollment.id, nonce, expiresAt: expiresAt.toISOString(), algorithm: "Ed25519", purpose: "RIG_GATEWAY_ENROLLMENT_V1" } }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("RIG gateway challenge error", cause);
    return NextResponse.json({ error: { code: "SERVICE_UNAVAILABLE", message: "Gateway enrollment is unavailable." } }, { status: 503 });
  }
}
