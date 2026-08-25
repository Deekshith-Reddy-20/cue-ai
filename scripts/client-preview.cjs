/**
 * Client preview: ensure Next on :3000, then open an ngrok HTTPS tunnel.
 * Usage: npm run client-preview
 */
const { spawn } = require("node:child_process");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const ngrok = require("@ngrok/ngrok");

const ROOT = path.resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env) || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(ROOT, ".env.local"));
loadEnvFile(path.join(ROOT, "apps", "web", ".env.local"));

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function checkLocal(port) {
  return new Promise((resolve) => {
    const req = http.get({ host: "127.0.0.1", port, path: "/", timeout: 1500 }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  if (!process.env.NGROK_AUTHTOKEN) {
    console.error("[client-preview] Set NGROK_AUTHTOKEN in .env.local first.");
    process.exit(1);
  }

  if (!(await checkLocal(3000))) {
    console.log("[client-preview] Starting Next.js on :3000 …");
    const nextProc = spawn(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["run", "dev:web"],
      {
        cwd: ROOT,
        stdio: "ignore",
        detached: true,
        env: process.env,
        windowsHide: true,
      }
    );
    nextProc.unref();
    for (let i = 0; i < 90; i++) {
      if (await checkLocal(3000)) break;
      await wait(500);
    }
    if (!(await checkLocal(3000))) {
      console.error("[client-preview] Next.js did not become ready on :3000.");
      process.exit(1);
    }
  } else {
    console.log("[client-preview] Next.js already running on :3000");
  }

  console.log("[client-preview] Opening ngrok tunnel …");
  const listener = await ngrok.forward({
    addr: 3000,
    authtoken_from_env: true,
  });
  const publicUrl = listener.url();

  const hintPath = path.join(ROOT, "apps", "web", ".env.ngrok.local");
  fs.writeFileSync(
    hintPath,
    `# Auto-generated for client preview — gitignored via .env*\n` +
      `# Restart Next after copying these into .env.local for OAuth.\n` +
      `NEXT_PUBLIC_APP_URL=${publicUrl}\n` +
      `AUTH_URL=${publicUrl}\n`,
    "utf8"
  );

  console.log("\n========================================");
  console.log(` Client URL:  ${publicUrl}`);
  console.log(` Wrote:       ${hintPath}`);
  console.log(" Email/local session auth works immediately via the Client URL.");
  console.log(" For OAuth: copy AUTH_URL / NEXT_PUBLIC_APP_URL into apps/web/.env.local,");
  console.log("            add matching provider callbacks, then restart Next.");
  console.log("========================================\n");

  setInterval(() => {}, 60_000);
  const shutdown = async () => {
    try {
      await listener.close();
    } catch {
      // ignore
    }
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

main().catch((err) => {
  console.error("[client-preview]", err instanceof Error ? err.message : err);
  process.exit(1);
});
