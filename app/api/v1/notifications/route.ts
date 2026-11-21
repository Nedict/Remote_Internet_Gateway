import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { notifications } from "@/lib/db/notifications-schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getAuth().api.getSession({ headers: request.headers });
    if (!session) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Sign in to view notifications." } }, { status: 401 });
    const rows = await getDb().select({ id: notifications.id, category: notifications.category, title: notifications.title, body: notifications.body, readAt: notifications.readAt, createdAt: notifications.createdAt })
      .from(notifications).where(eq(notifications.userId, session.user.id)).orderBy(desc(notifications.createdAt)).limit(50);
    return NextResponse.json({ data: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("RIG notification list error", cause);
    return NextResponse.json({ error: { code: "SERVICE_UNAVAILABLE", message: "Notifications are unavailable." } }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getAuth().api.getSession({ headers: request.headers });
    if (!session) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Sign in to update notifications." } }, { status: 401 });
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: { code: "INVALID_JSON", message: "Send a valid JSON object." } }, { status: 400 }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: { code: "INVALID_BODY", message: "Send a JSON object." } }, { status: 400 });
    const { ids, all } = body as { ids?: unknown; all?: unknown };
    if (all === true && ids === undefined) {
      await getDb().update(notifications).set({ readAt: new Date() }).where(eq(notifications.userId, session.user.id));
    } else if (Array.isArray(ids) && ids.length > 0 && ids.length <= 50 && ids.every((id) => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id))) {
      const { inArray, and, isNull } = await import("drizzle-orm");
      await getDb().update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, session.user.id), inArray(notifications.id, ids), isNull(notifications.readAt)));
    } else return NextResponse.json({ error: { code: "INVALID_FIELDS", message: "Provide all: true or 1 to 50 notification IDs." } }, { status: 400 });
    return NextResponse.json({ data: { updated: true } }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("RIG notification update error", cause);
    return NextResponse.json({ error: { code: "SERVICE_UNAVAILABLE", message: "Notifications are unavailable." } }, { status: 503 });
  }
}
