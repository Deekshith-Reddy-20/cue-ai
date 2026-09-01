import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server/api-auth";
import { appendAudit, readStore, updateStore, type DbAiConfig } from "@/lib/server/db";
import { decryptSecret, encryptSecret, maskSecret } from "@/lib/server/session";

function publicAi(ai: DbAiConfig) {
  const raw = ai.apiKeyEnc ? decryptSecret(ai.apiKeyEnc) : "";
  return {
    provider: ai.provider,
    model: ai.model,
    enabledProviders: ai.enabledProviders,
    enabledModels: ai.enabledModels,
    defaultModel: ai.defaultModel,
    endpoint: ai.endpoint || "",
    hasApiKey: Boolean(raw),
    apiKeyMasked: raw ? maskSecret(raw) : "",
    updatedAt: ai.updatedAt || null,
    updatedBy: ai.updatedBy || null,
  };
}

export async function GET(req: NextRequest) {
  const { error } = await requirePermission("ai.read", req);
  if (error) return error;
  const store = await readStore();
  return NextResponse.json({ ai: publicAi(store.ai) });
}

export async function PATCH(req: NextRequest) {
  const { error, session } = await requirePermission("ai.write", req);
  if (error || !session) return error;

  const body = (await req.json().catch(() => null)) as
    | {
        provider?: DbAiConfig["provider"];
        model?: string;
        defaultModel?: string;
        endpoint?: string;
        apiKey?: string;
        enabledProviders?: DbAiConfig["enabledProviders"];
        enabledModels?: string[];
        clearApiKey?: boolean;
      }
    | null;

  const store = await updateStore(async (s) => {
    if (body?.provider) s.ai.provider = body.provider;
    if (body?.model) s.ai.model = body.model;
    if (body?.defaultModel) s.ai.defaultModel = body.defaultModel;
    if (typeof body?.endpoint === "string") s.ai.endpoint = body.endpoint;
    if (Array.isArray(body?.enabledProviders)) s.ai.enabledProviders = body.enabledProviders;
    if (Array.isArray(body?.enabledModels)) s.ai.enabledModels = body.enabledModels;
    if (body?.clearApiKey) s.ai.apiKeyEnc = "";
    if (typeof body?.apiKey === "string" && body.apiKey.trim()) {
      // Never persist plaintext
      s.ai.apiKeyEnc = encryptSecret(body.apiKey.trim());
    }
    // Validate provider/model combo
    if (s.ai.enabledModels.length && !s.ai.enabledModels.includes(s.ai.defaultModel)) {
      s.ai.enabledModels = [...s.ai.enabledModels, s.ai.defaultModel];
    }
    s.ai.updatedAt = new Date().toISOString();
    s.ai.updatedBy = session.userId;
    await appendAudit(s, {
      actorId: session.userId,
      actorName: session.name,
      action: "ai.config_changed",
      resourceType: "ai",
      metadata: {
        provider: s.ai.provider,
        model: s.ai.model,
        defaultModel: s.ai.defaultModel,
        keyUpdated: Boolean(body?.apiKey) || Boolean(body?.clearApiKey),
      },
    });
  });

  return NextResponse.json({ ai: publicAi(store.ai) });
}

export async function POST(req: NextRequest) {
  // Connection test — does not return secrets
  const { error, session } = await requirePermission("ai.write", req);
  if (error || !session) return error;

  const store = await readStore();
  const key = store.ai.apiKeyEnc ? decryptSecret(store.ai.apiKeyEnc) : process.env.GROQ_API_KEY || "";
  if (!key) {
    return NextResponse.json({ ok: false, error: "No API key configured." }, { status: 400 });
  }

  try {
    const endpoint = (store.ai.endpoint || "https://api.groq.com/openai/v1").replace(/\/$/, "");
    const res = await fetch(`${endpoint}/models`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        error: `Provider responded with ${res.status}`,
      });
    }
    return NextResponse.json({ ok: true, message: "Connection successful." });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : "Connection failed",
    });
  }
}
