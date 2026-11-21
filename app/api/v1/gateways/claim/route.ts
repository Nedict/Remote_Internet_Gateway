import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * A browser session and a setup code cannot authenticate gateway hardware.
 * Do not consume a code or mark a gateway online here. Device claim will be
 * enabled only alongside a machine-authenticated identity and credential flow.
 */
export async function POST(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Sign in to manage gateways." } }, { status: 401 });
  return NextResponse.json({ error: { code: "DEVICE_AUTH_REQUIRED", message: "Gateway device claiming is not enabled until machine identity is configured." } }, { status: 501, headers: { "Cache-Control": "no-store" } });
}
