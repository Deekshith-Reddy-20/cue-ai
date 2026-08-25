/**
 * Start an ngrok HTTPS tunnel to the Next.js dev server (port 3000).
 * Uses @ngrok/ngrok SDK (no broken Windows npx binary wrapper).
 * Reads NGROK_AUTHTOKEN from env / gitignored .env.local — never logs it.
 *
 * Usage: npm run ngrok
 */
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

async function main() {
  if (!process.env.NGROK_AUTHTOKEN) {
    console.error(
      "[ngrok] NGROK_AUTHTOKEN is not set.\n" +
        "Add it to .env.local (gitignored), then re-run: npm run ngrok"
    );
    process.exit(1);
  }

  console.log("[ngrok] Opening HTTPS tunnel → http://127.0.0.1:3000 …");
  const listener = await ngrok.forward({
    addr: 3000,
    authtoken_from_env: true,
  });
  const url = listener.url();
  console.log("\n========================================");
  console.log(` Client URL:  ${url}`);
  console.log(" Leave this process running while the client tests.");
  console.log(" For OAuth: set AUTH_URL and NEXT_PUBLIC_APP_URL to this URL,");
  console.log(" then restart Next. Local email/session auth works immediately.");
  console.log("========================================\n");

  const hintPath = path.join(ROOT, "apps", "web", ".env.ngrok.local");
  fs.writeFileSync(
    hintPath,
    `# Auto-generated — gitignored via .env*\nNEXT_PUBLIC_APP_URL=${url}\nAUTH_URL=${url}\n`,
    "utf8"
  );
  console.log(`[ngrok] Wrote ${hintPath}`);

  const keepAlive = () => {
    /* hold process open until Ctrl+C */
  };
  setInterval(keepAlive, 60_000);

  const shutdown = async () => {
    console.log("\n[ngrok] Closing tunnel…");
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
  console.error("[ngrok]", err instanceof Error ? err.message : err);
  process.exit(1);
});
