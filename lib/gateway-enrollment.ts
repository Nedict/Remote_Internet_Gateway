import "server-only";
import { createHash, randomBytes, randomInt } from "node:crypto";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateEnrollmentCode(): string {
  let code = "";
  for (let i = 0; i < 12; i++) code += alphabet[randomInt(alphabet.length)];
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`;
}

export function hashEnrollmentCode(code: string): string {
  return createHash("sha256").update(code.replace(/[^A-Z0-9]/gi, "").toUpperCase()).digest("hex");
}

export function hashSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function normalizeEnrollmentCode(code: unknown): string | null {
  if (typeof code !== "string") return null;
  const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^[A-Z0-9]{12}$/.test(normalized) ? normalized : null;
}

export function enrollmentProofMessage(enrollmentId: string, nonce: string): Buffer {
  return Buffer.from(`RIG_GATEWAY_ENROLLMENT_V1\\n${enrollmentId}\\n${nonce}`, "utf8");
}
