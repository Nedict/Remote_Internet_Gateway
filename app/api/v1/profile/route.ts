import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  try {
    const session = await getAuth().api.getSession({ headers: request.headers });
    if (!session) return errorResponse(401, "UNAUTHENTICATED", "Sign in to view your profile.");
    const db = getDb();
    await db.insert(profiles).values({ userId: session.user.id, displayName: session.user.name }).onConflictDoNothing({ target: profiles.userId });
    const [profile] = await db.select({ id: profiles.id, displayName: profiles.displayName, timezone: profiles.timezone, createdAt: profiles.createdAt }).from(profiles).where(eq(profiles.userId, session.user.id)).limit(1);
    return NextResponse.json({ data: { user: { id: session.user.id, name: session.user.name, email: session.user.email, image: session.user.image }, profile }, }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("RIG profile API error", error);
    return errorResponse(503, "SERVICE_UNAVAILABLE", "Profile service is not configured.");
  }
}

/** Update only the authenticated user's profile preferences. */
export async function PATCH(request: Request) {
  try {
    const session = await getAuth().api.getSession({ headers: request.headers });
    if (!session) return errorResponse(401, "UNAUTHENTICATED", "Sign in to update your profile.");

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse(400, "INVALID_JSON", "Send a valid JSON object.");
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) return errorResponse(400, "INVALID_BODY", "Send a JSON object.");

    const input = body as Record<string, unknown>;
    const allowedKeys = new Set(["displayName", "timezone"]);
    if (Object.keys(input).length === 0 || Object.keys(input).some((key) => !allowedKeys.has(key))) {
      return errorResponse(400, "INVALID_FIELDS", "Only displayName and timezone can be updated.");
    }

    const updates: { displayName?: string; timezone?: string; updatedAt: Date } = { updatedAt: new Date() };
    if (Object.hasOwn(input, "displayName")) {
      if (typeof input.displayName !== "string" || input.displayName.trim().length < 1 || input.displayName.trim().length > 80) {
        return errorResponse(400, "INVALID_DISPLAY_NAME", "Display name must be between 1 and 80 characters.");
      }
      updates.displayName = input.displayName.trim();
    }
    if (Object.hasOwn(input, "timezone")) {
      if (typeof input.timezone !== "string" || input.timezone.length > 100) return errorResponse(400, "INVALID_TIMEZONE", "Choose a valid timezone.");
      try {
        new Intl.DateTimeFormat("en-US", { timeZone: input.timezone });
      } catch {
        return errorResponse(400, "INVALID_TIMEZONE", "Choose a valid timezone.");
      }
      updates.timezone = input.timezone;
    }

    const db = getDb();
    await db.insert(profiles).values({ userId: session.user.id, displayName: session.user.name }).onConflictDoNothing({ target: profiles.userId });
    const [profile] = await db.update(profiles).set(updates).where(eq(profiles.userId, session.user.id)).returning({ id: profiles.id, displayName: profiles.displayName, timezone: profiles.timezone, updatedAt: profiles.updatedAt });
    return NextResponse.json({ data: profile }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("RIG profile update error", error);
    return errorResponse(503, "SERVICE_UNAVAILABLE", "Profile service is not configured.");
  }
}
