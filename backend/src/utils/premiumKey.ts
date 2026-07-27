import crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * Generates a human-friendly activation key, e.g. WORM-4F2A-9X7B-Q1ZK
 * The raw key is only ever shown once at generation time; only its hash is stored.
 */
export function generateRawKey(): string {
  const segment = () =>
    crypto.randomBytes(2).toString("hex").toUpperCase().slice(0, 4);
  return `WORM-${segment()}-${segment()}-${segment()}`;
}

export async function hashKey(rawKey: string): Promise<string> {
  return bcrypt.hash(rawKey, 10);
}

export async function compareKey(rawKey: string, hash: string): Promise<boolean> {
  return bcrypt.compare(rawKey, hash);
}
