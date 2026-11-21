import "server-only";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";

/**
 * DB-backed fixed-window limiter. Source IP headers must only be trusted when
 * set/overwritten by the deployment's trusted reverse proxy.
 */
export async function allowRequest(db: ReturnType<typeof import("@/lib/db").getDb>, scope: string, subject: string, limit: number, windowSeconds: number): Promise<boolean> {
  const bucket = createHash("sha256").update(`${scope}:${subject}`).digest("hex");
  const result = await db.execute(sql`
    INSERT INTO rig_rate_limits (bucket_key, window_start, attempts, expires_at)
    VALUES (${bucket}, date_trunc('minute', now()), 1, now() + (${windowSeconds} * interval '1 second'))
    ON CONFLICT (bucket_key) DO UPDATE
    SET attempts = CASE
          WHEN rig_rate_limits.expires_at <= now() THEN 1
          ELSE rig_rate_limits.attempts + 1
        END,
        window_start = CASE
          WHEN rig_rate_limits.expires_at <= now() THEN date_trunc('minute', now())
          ELSE rig_rate_limits.window_start
        END,
        expires_at = CASE
          WHEN rig_rate_limits.expires_at <= now() THEN now() + (${windowSeconds} * interval '1 second')
          ELSE rig_rate_limits.expires_at
        END
    RETURNING attempts <= ${limit} AS allowed
  `);
  return (result.rows[0] as { allowed: boolean } | undefined)?.allowed === true;
}

export function requestSource(request: Request): string {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "unknown";
}
