/**
 * CueAI application access — normal users vs admins.
 * Resume Tailor lives at /resume as a separate product (outside CueAI chrome).
 */

import { canAccessAdmin } from "@/lib/roles";

/** Core CueAI modules for every authenticated normal user (web + Windows). */
export const CUEAI_USER_NAV_HREFS = [
  "/dashboard",
  "/meetings",
  "/meetings/live",
  "/companion",
  "/settings",
] as const;

/**
 * Paths blocked for normal users inside authenticated CueAI.
 * Admins may still open these.
 */
export const USER_BLOCKED_PATH_PREFIXES = [
  "/admin",
  "/knowledge",
  "/translation",
  "/screen-context",
] as const;

export function isCueaiUserNavHref(href: string): boolean {
  return (CUEAI_USER_NAV_HREFS as readonly string[]).includes(href);
}

export function isUserBlockedPath(pathname: string): boolean {
  return USER_BLOCKED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Whether the current role may open a CueAI in-app path.
 * Non-admins cannot open admin / knowledge / translation / screen-context.
 */
export function canAccessCueaiPath(
  pathname: string,
  role?: string | null,
): boolean {
  if (canAccessAdmin(role)) return true;
  return !isUserBlockedPath(pathname);
}

/** Free-tier Q&A cap for meeting summaries (admins + premium bypass). */
export const FREE_MEETING_QA_LIMIT = 5;
