"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { AUTH_BYPASS } from "@/lib/auth";

/** Require a local/OAuth session for app routes unless auth bypass is enabled. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready || AUTH_BYPASS) return;
    if (!session) {
      router.replace(`/signup?next=${encodeURIComponent(pathname || "/dashboard")}`);
    }
  }, [ready, session, router, pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        Loading workspace…
      </div>
    );
  }

  if (!AUTH_BYPASS && !session) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        Redirecting to sign up…
      </div>
    );
  }

  return <>{children}</>;
}
