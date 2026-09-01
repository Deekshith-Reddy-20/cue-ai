import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Generate a high-entropy invite token (never store the raw value). */
export function generateInviteToken() {
  return randomBytes(32).toString("hex");
}

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function inviteTokenMatches(rawToken: string, storedHashOrLegacy: string) {
  if (!rawToken || !storedHashOrLegacy) return false;

  // Legacy plaintext tokens were 32-char hex (uuid without dashes).
  if (storedHashOrLegacy.length === 32 && rawToken.length === 32) {
    try {
      return timingSafeEqual(Buffer.from(rawToken), Buffer.from(storedHashOrLegacy));
    } catch {
      return rawToken === storedHashOrLegacy;
    }
  }

  // Current format: store SHA-256 hex (64 chars); compare hash(raw) to stored.
  const hashed = hashInviteToken(rawToken);
  if (hashed.length !== storedHashOrLegacy.length) return false;
  try {
    return timingSafeEqual(Buffer.from(hashed), Buffer.from(storedHashOrLegacy));
  } catch {
    return hashed === storedHashOrLegacy;
  }
}

export function isInviteExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() <= Date.now();
}
