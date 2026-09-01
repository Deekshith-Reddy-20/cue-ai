"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import {
  clearSession,
  getSession,
  AUTH_BYPASS,
  DEV_GUEST_SESSION,
  workspaceFromName,
  logoutApi,
  syncSessionFromServer,
  type CueSession,
} from "@/lib/auth";
import { normalizeRole } from "@/lib/roles";

type AuthContextValue = {
  session: CueSession | null;
  ready: boolean;
  refresh: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: nextSession, status } = useSession();
  const [localSession, setLocalSession] = useState<CueSession | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setLocalSession(getSession());
    void syncSessionFromServer().then((s) => {
      if (s) setLocalSession(s);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (AUTH_BYPASS) {
      const guest = getSession() || DEV_GUEST_SESSION;
      if (typeof window !== "undefined") {
        localStorage.setItem("cueai-session", JSON.stringify(guest));
      }
      setLocalSession(guest);
      setReady(true);
      return;
    }

    if (status === "loading") return;

    if (nextSession?.user) {
      const name = nextSession.user.name || nextSession.user.email?.split("@")[0] || "User";
      const email = nextSession.user.email || "";
      const existing = getSession();
      const oauthSession: CueSession = {
        userId: email || name,
        name,
        email,
        workspace:
          existing?.email === email && existing.workspace
            ? existing.workspace
            : workspaceFromName(name),
        role: normalizeRole(existing?.role || "User"),
      };
      localStorage.setItem("cueai-session", JSON.stringify(oauthSession));
      setLocalSession(oauthSession);
      setReady(true);
      return;
    }

    void syncSessionFromServer().then((s) => {
      setLocalSession(s);
      setReady(true);
    });
  }, [nextSession, status]);

  const logout = useCallback(async () => {
    if (AUTH_BYPASS) {
      localStorage.setItem("cueai-session", JSON.stringify(DEV_GUEST_SESSION));
      setLocalSession({ ...DEV_GUEST_SESSION });
      return;
    }
    await logoutApi();
    clearSession();
    setLocalSession(null);
    if (status === "authenticated") {
      await nextAuthSignOut({ redirect: false });
    }
  }, [status]);

  return (
    <AuthContext.Provider value={{ session: localSession, ready, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
