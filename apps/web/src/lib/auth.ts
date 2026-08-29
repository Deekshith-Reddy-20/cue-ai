export type CueUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  workspace: string;
  createdAt: string;
};

export type CueSession = {
  userId: string;
  name: string;
  email: string;
  workspace: string;
};

const USERS_KEY = "cueai-users";
const SESSION_KEY = "cueai-session";

/**
 * Auth bypass is OFF by default so Start free / signup creates a real user workspace.
 * Set NEXT_PUBLIC_SKIP_AUTH=true only for local demos without login.
 */
export const AUTH_BYPASS =
  process.env.NEXT_PUBLIC_SKIP_AUTH === "true" ||
  process.env.NEXT_PUBLIC_SKIP_AUTH === "1";

export const DEV_GUEST_SESSION: CueSession = {
  userId: "dev-guest",
  name: "User",
  email: "user@cueai.local",
  workspace: "Your Workspace",
};

function isLegacyIndraSession(session: CueSession) {
  return (
    session.userId === "dev-guest" ||
    session.name === "Indra" ||
    /indra/i.test(session.workspace) ||
    session.email === "dev@cueai.local"
  );
}

function readUsers(): CueUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as CueUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: CueUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function persistSession(session: CueSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession(): CueSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const session = JSON.parse(raw) as CueSession;
      // Migrate old hardcoded Indra guest → generic user workspace.
      if (isLegacyIndraSession(session) && AUTH_BYPASS) {
        return persistSession({ ...DEV_GUEST_SESSION });
      }
      if (isLegacyIndraSession(session) && !AUTH_BYPASS) {
        // Force re-auth so Start free / signup can set the real user.
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    }
  } catch {
    // ignore
  }
  if (AUTH_BYPASS) {
    return persistSession({ ...DEV_GUEST_SESSION });
  }
  return null;
}

function setSession(user: CueUser) {
  const session: CueSession = {
    userId: user.id,
    name: user.name,
    email: user.email,
    workspace: user.workspace,
  };
  return persistSession(session);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function workspaceFromName(name: string) {
  const first = name.trim().split(/\s+/)[0] || "My";
  return `${first}'s Workspace`;
}

export function updateSessionProfile(partial: {
  name?: string;
  email?: string;
  workspace?: string;
}): CueSession | null {
  const current = getSession();
  if (!current) return null;
  const next: CueSession = {
    ...current,
    name: partial.name?.trim() || current.name,
    email: partial.email?.trim() || current.email,
    workspace: partial.workspace?.trim() || current.workspace,
  };
  persistSession(next);

  // Keep matching local email user in sync when present.
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === current.userId || u.email === current.email);
  if (idx >= 0) {
    const user = users[idx]!;
    users[idx] = {
      ...user,
      name: next.name,
      email: next.email.toLowerCase(),
      workspace: next.workspace,
    };
    writeUsers(users);
  }
  return next;
}

export type AuthResult =
  | { ok: true; session: CueSession }
  | { ok: false; error: string };

export function signupWithEmail(input: {
  name: string;
  email: string;
  password: string;
}): AuthResult {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!name) return { ok: false, error: "Please enter your full name." };
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const users = readUsers();
  if (users.some((u) => u.email === email)) {
    return {
      ok: false,
      error: "An account with this email already exists. Please sign in.",
    };
  }

  const user: CueUser = {
    id: crypto.randomUUID(),
    name,
    email,
    password,
    workspace: workspaceFromName(name),
    createdAt: new Date().toISOString(),
  };

  writeUsers([...users, user]);
  return { ok: true, session: setSession(user) };
}

export function loginWithEmail(input: {
  email: string;
  password: string;
}): AuthResult {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }

  const user = readUsers().find((u) => u.email === email);
  if (!user) {
    return {
      ok: false,
      error: "No account found with this email. Please sign up first.",
    };
  }
  if (user.password !== password) {
    return { ok: false, error: "Incorrect password. Please try again." };
  }

  return { ok: true, session: setSession(user) };
}

export function greetingFor(name: string) {
  const hour = new Date().getHours();
  const first = name.trim().split(/\s+/)[0] || "there";
  const hi =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return `${hi}, ${first}`;
}

export function deleteAccountLocal(): void {
  const session = getSession();
  if (session) {
    writeUsers(readUsers().filter((u) => u.id !== session.userId && u.email !== session.email));
  }
  clearSession();
}
