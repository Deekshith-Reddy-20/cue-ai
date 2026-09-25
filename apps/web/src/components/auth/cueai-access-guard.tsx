"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { canAccessCueaiPath } from "@/lib/app-access";

/**
 * Route guard for authenticated CueAI (web + Electron).
 * Blocks admin / knowledge / translation / screen-context for normal users.
 * Resume Tailor lives outside this layout at /resume.
 */
export function CueaiAccessGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { session, ready } = useAuth();

  const allowed = canAccessCueaiPath(pathname, session?.role);

  useEffect(() => {
    if (!ready) return;
    if (!allowed) {
      router.replace("/dashboard");
    }
  }, [ready, allowed, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        Checking access…
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        Redirecting…
      </div>
    );
  }

  return <>{children}</>;
}
