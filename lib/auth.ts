import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@/lib/db";
import { accounts, sessions, users, verifications } from "@/lib/db/schema";

let authInstance: ReturnType<typeof betterAuth> | undefined;

export function getAuth() {
  if (authInstance) return authInstance;
  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;
  if (!secret || secret.length < 32) throw new Error("BETTER_AUTH_SECRET must be configured with at least 32 characters");
  if (!baseURL) throw new Error("BETTER_AUTH_URL is not configured");

  authInstance = betterAuth({
    appName: "RIG",
    secret,
    baseURL,
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: { user: users, session: sessions, account: accounts, verification: verifications },
    }),
    emailAndPassword: { enabled: true },
    advanced: { useSecureCookies: process.env.NODE_ENV === "production" },
  });
  return authInstance;
}
