import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getAuth().api.getSession({ headers: request.headers });
    if (!session) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Sign in to view your profile." } }, { status: 401 });
    const db = getDb();
    await db.insert(profiles).values({ userId: session.user.id, displayName: session.user.name }).onConflictDoNothing({ target: profiles.userId });
    const [profile] = await db.select({ id: profiles.id, displayName: profiles.displayName, timezone: profiles.timezone, createdAt: profiles.createdAt }).from(profiles).where(eq(profiles.userId, session.user.id)).limit(1);
    return NextResponse.json({ data: { user: { id: session.user.id, name: session.user.name, email: session.user.email, image: session.user.image }, profile } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("RIG profile API error", error);
    return NextResponse.json({ error: { code: "SERVICE_UNAVAILABLE", message: "Profile service is not configured." } }, { status: 503 });
  }
}
