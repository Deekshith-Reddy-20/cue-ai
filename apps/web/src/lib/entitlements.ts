/**
 * Entitlements / premium access.
 * Hooks into future billing; today uses env + optional session flag.
 * Do not invent fake premium users.
 */

import { canAccessAdmin } from "@/lib/roles";

export type EntitlementSnapshot = {
  /** Full meeting Q&A, transcripts where product allows, etc. */
  premiumMeetings: boolean;
  source: "admin" | "env" | "session" | "free";
};

/**
 * Resolve meeting-premium entitlement.
 * - Admins: full access (not a "free user")
 * - PREMIUM_MEETINGS=1 or NEXT_PUBLIC_PREMIUM_MEETINGS=1: workspace-wide premium (dev/ops)
 * - session.premiumMeetings if ever stamped on the cookie/session
 * - otherwise free
 */
export function resolveMeetingEntitlement(input: {
  role?: string | null;
  premiumMeetings?: boolean | null;
}): EntitlementSnapshot {
  if (canAccessAdmin(input.role)) {
    return { premiumMeetings: true, source: "admin" };
  }
  if (input.premiumMeetings === true) {
    return { premiumMeetings: true, source: "session" };
  }
  const envOn =
    process.env.NEXT_PUBLIC_PREMIUM_MEETINGS === "1" ||
    process.env.PREMIUM_MEETINGS === "1";
  if (envOn) {
    return { premiumMeetings: true, source: "env" };
  }
  return { premiumMeetings: false, source: "free" };
}

export function canViewFullMeetingQa(entitlement: EntitlementSnapshot): boolean {
  return entitlement.premiumMeetings;
}
