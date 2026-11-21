import { NextResponse } from "next/server";
import { createHash, createPublicKey, randomBytes, timingSafeEqual, verify } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { enrollmentProofMessage, hashEnrollmentCode, hashSecret, normalizeEnrollmentCode } from "@/lib/gateway-enrollment";
import { allowRequest, requestSource } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
function fail(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}
function equalHex(a: string, b: string) {
  if (!/^[a-f0-9]{64}$/i.test(a) || !/^[a-f0-9]{64}$/i.test(b)) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    if (!await allowRequest(db, "enrollment-claim", requestSource(request), 10, 60)) return fail("RATE_LIMITED", "Too many enrollment attempts. Try again shortly.", 429);
    let body: unknown;
    try { body = await request.json(); } catch { return fail("INVALID_JSON", "Send a valid JSON object.", 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return fail("INVALID_BODY", "Send a JSON object.", 400);
    const input = body as Record<string, unknown>;
    const code = normalizeEnrollmentCode(input.code);
    const { enrollmentId, nonce, publicKey, signature, deviceName } = input;
    if (!code || typeof enrollmentId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(enrollmentId)) return fail("INVALID_ENROLLMENT", "A valid setup code and enrollment ID are required.", 400);
    if (typeof nonce !== "string" || nonce.length > 100 || typeof publicKey !== "string" || publicKey.length > 2048 || typeof signature !== "string" || signature.length > 1024) return fail("INVALID_PROOF", "The device proof is invalid.", 400);
    if (typeof deviceName !== "string" || deviceName.trim().length < 1 || deviceName.trim().length > 80) return fail("INVALID_DEVICE_NAME", "Device name must be between 1 and 80 characters.", 400);

    let validSignature = false;
    try {
      const key = createPublicKey(publicKey);
      if (key.asymmetricKeyType !== "ed25519") return fail("INVALID_KEY_TYPE", "Use an Ed25519 public key.", 400);
      const signatureBytes = Buffer.from(signature, "base64url");
      if (signatureBytes.length !== 64) return fail("INVALID_PROOF", "The device proof is invalid.", 400);
      validSignature = verify(null, enrollmentProofMessage(enrollmentId, nonce), key, signatureBytes);
    } catch { return fail("INVALID_PUBLIC_KEY", "The Ed25519 public key or signature is malformed.", 400); }
    if (!validSignature) return fail("INVALID_PROOF", "The device proof could not be verified.", 401);

    const credential = randomBytes(32).toString("base64url");
    const credentialHash = createHash("sha256").update(credential).digest("hex");
    const codeHash = hashEnrollmentCode(code);
    const nonceHash = hashSecret(nonce);
    const claimed = await db.transaction(async (tx) => {
      const locked = await tx.execute(sql`
        SELECT id, gateway_id, code_hash, challenge_hash FROM rig_gateway_enrollments
        WHERE id = ${enrollmentId} AND status = 'pending' AND expires_at > now() AND challenge_expires_at > now()
        FOR UPDATE
      `);
      const row = locked.rows[0] as { id: string; gateway_id: string; code_hash: string; challenge_hash: string } | undefined;
      if (!row || !equalHex(row.code_hash, codeHash) || !equalHex(row.challenge_hash, nonceHash)) return null;
      const inserted = await tx.execute(sql`
        INSERT INTO rig_device_identities (gateway_id, device_name, public_key, credential_hash, status)
        VALUES (${row.gateway_id}::uuid, ${deviceName.trim()}, ${publicKey}, ${credentialHash}, 'active')
        RETURNING id, gateway_id
      `);
      const identity = inserted.rows[0] as { id: string; gateway_id: string } | undefined;
      if (!identity) throw new Error("Device identity insert failed");
      const consumed = await tx.execute(sql`
        UPDATE rig_gateway_enrollments SET status = 'consumed', consumed_at = now(), challenge_hash = NULL, challenge_expires_at = NULL
        WHERE id = ${row.id} AND status = 'pending' AND expires_at > now() RETURNING id
      `);
      if (consumed.rows.length !== 1) throw new Error("Enrollment code could not be consumed");
      await tx.execute(sql`UPDATE rig_gateways SET status = 'online', last_seen_at = now(), updated_at = now() WHERE id = ${row.gateway_id}::uuid`);
      await tx.execute(sql`INSERT INTO rig_audit_events (action, resource_type, resource_id, metadata) VALUES ('gateway.device.enrolled', 'gateway', ${row.gateway_id}, jsonb_build_object('deviceIdentityId', ${identity.id}))`);
      return identity;
    });
    if (!claimed) return fail("INVALID_OR_EXPIRED_PROOF", "The enrollment proof is invalid, expired, or already used.", 409);
    return NextResponse.json({ data: { gatewayId: claimed.gateway_id, deviceIdentityId: claimed.id, credential, credentialType: "Bearer", status: "active" } }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("RIG gateway enrollment claim error", cause);
    return fail("SERVICE_UNAVAILABLE", "Gateway enrollment is unavailable.", 503);
  }
}
