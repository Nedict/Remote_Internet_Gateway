import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function generateEnrollmentCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(12);
  let code = "";
  for (let i = 0; i < 12; i++) code += alphabet[bytes[i] % alphabet.length];
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`;
}

export function hashEnrollmentCode(code: string): string {
  return createHash("sha256").update(code.replace(/[^A-Z0-9]/gi, "").toUpperCase()).digest("hex");
}

export function secureCodeMatch(expectedHash: string, suppliedCode: string): boolean {
  const suppliedHash = Buffer.from(hashEnrollmentCode(suppliedCode));
  const expected = Buffer.from(expectedHash, "hex");
  return expected.length === suppliedHash.length && timingSafeEqual(expected, suppliedHash);
}

export function normalizeEnrollmentCode(code: unknown): string | null {
  if (typeof code !== "string") return null;
  const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^[A-Z0-9]{12}$/.test(normalized) ? normalized : null;
}
