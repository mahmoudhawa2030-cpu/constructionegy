#!/usr/bin/env node
/**
 * One-shot helper: check env, generate secrets, apply DB migration (Supabase CLI),
 * print webhook copy-paste, optional dry-run of /api/push/notify.
 *
 * Usage:
 *   node scripts/push-setup.cjs
 *   node scripts/push-setup.cjs check
 *   node scripts/push-setup.cjs secret
 *   node scripts/push-setup.cjs db-push
 *   node scripts/push-setup.cjs webhook
 *   node scripts/push-setup.cjs test-notify [baseUrl]
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");

function loadEnvFiles() {
  const out = { ...process.env };
  for (const name of [".env.local", ".env"]) {
    const p = path.join(ROOT, name);
    if (!fs.existsSync(p)) continue;
    const raw = fs.readFileSync(p, "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      out[key] = val;
    }
  }
  return out;
}

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function cmdCheck() {
  const env = loadEnvFiles();
  const checks = [];

  const migration = path.join(ROOT, "supabase", "migrations", "20260330100000_user_push_tokens.sql");
  checks.push(["Migration file exists", fs.existsSync(migration)]);

  checks.push(["NEXT_PUBLIC_SUPABASE_URL", Boolean(env.NEXT_PUBLIC_SUPABASE_URL?.trim())]);
  checks.push([
    "NEXT_PUBLIC_SUPABASE_ANON_KEY (or PUBLISHABLE)",
    Boolean(
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim(),
    ),
  ]);
  checks.push(["SUPABASE_SERVICE_ROLE_KEY (server push + notify)", Boolean(env.SUPABASE_SERVICE_ROLE_KEY?.trim())]);
  checks.push(["PUSH_NOTIFY_SECRET (webhook auth)", Boolean(env.PUSH_NOTIFY_SECRET?.trim())]);

  let fbOk = false;
  if (env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) {
    try {
      JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
      fbOk = true;
    } catch {
      fbOk = false;
    }
  }
  checks.push(["FIREBASE_SERVICE_ACCOUNT_JSON (valid JSON, optional)", fbOk || !env.FIREBASE_SERVICE_ACCOUNT_JSON]);

  const gs = path.join(ROOT, "android", "app", "google-services.json");
  let gsPlaceholder = false;
  let gsExists = fs.existsSync(gs);
  if (gsExists) {
    try {
      const raw = fs.readFileSync(gs, "utf8");
      const j = JSON.parse(raw);
      const apiKey = j?.client?.[0]?.api_key?.[0]?.current_key;
      const projectId = j?.project_info?.project_id;
      const appId = j?.client?.[0]?.client_info?.mobilesdk_app_id;
      gsPlaceholder =
        String(apiKey ?? "").includes("placeholder") ||
        String(projectId ?? "").includes("placeholder") ||
        String(appId ?? "").includes("000000000000");
    } catch {
      gsPlaceholder = true;
    }
  }
  checks.push(["android/app/google-services.json exists", gsExists]);
  checks.push([
    "android/app/google-services.json is real Firebase (not repo placeholder)",
    gsExists && !gsPlaceholder,
  ]);

  console.log("\n=== Push / messaging setup check ===\n");
  for (const [label, ok] of checks) {
    console.log(`${ok ? "✓" : "✗"} ${label}`);
  }
  console.log(
    "\nFix missing items, then:\n  1) npm run db:push   (or: supabase db push)\n  2) node scripts/push-setup.cjs webhook\n  3) Set the same env vars on Vercel\n",
  );
}

function cmdSecret() {
  console.log(crypto.randomBytes(32).toString("hex"));
}

function cmdDbPush() {
  console.log("Running: npx supabase db push\n(Requires: supabase login + supabase link --project-ref <ref>)\n");
  const r = spawnSync("npx", ["supabase", "db", "push"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
  });
  process.exit(r.status === null ? 1 : r.status);
}

function cmdWebhook() {
  const env = loadEnvFiles();
  const appUrl = (env.NEXT_PUBLIC_APP_URL || env.VERCEL_URL || "").replace(/\/$/, "");
  const secret = env.PUSH_NOTIFY_SECRET?.trim();
  if (!appUrl) {
    console.log(
      "Set NEXT_PUBLIC_APP_URL in .env.local (e.g. https://constructionegy.vercel.app) to print the exact webhook URL.",
    );
  }
  if (!secret) {
    console.log("Set PUSH_NOTIFY_SECRET in .env.local (run: npm run push:secret) first.\n");
  }

  const notifyUrl = appUrl ? `${appUrl}/api/push/notify` : "https://<YOUR_VERCEL_DOMAIN>/api/push/notify";

  console.log("\n=== Supabase Dashboard → Database → Webhooks ===\n");
  console.log("Create a webhook:");
  console.log(`  Name:        message-push (or any)`);
  console.log(`  Table:       public.messages`);
  console.log(`  Events:      INSERT`);
  console.log(`  Type:        HTTP Request`);
  console.log(`  Method:      POST`);
  console.log(`  URL:         ${notifyUrl}`);
  console.log(`  HTTP Headers:`);
  console.log(`    Authorization: Bearer ${secret || "<paste PUSH_NOTIFY_SECRET>"}`);
  console.log(`      (alternative: x-webhook-secret: ${secret || "<same secret>"})`);
  console.log(`    Content-Type:  application/json`);
  console.log("\nVercel → Environment variables (Production + Preview if needed):");
  console.log("  SUPABASE_SERVICE_ROLE_KEY");
  console.log("  PUSH_NOTIFY_SECRET  (same value as in the header above)");
  console.log("  FIREBASE_SERVICE_ACCOUNT_JSON  (single-line JSON from Firebase service account key)");
  console.log("\nFirebase Console:");
  console.log("  Project → Build → Add app → Android → package: com.constructionegy.app");
  console.log("  Download google-services.json → save as android/app/google-services.json");
  console.log("  Project settings → Service accounts → Generate new private key → paste JSON into FIREBASE_SERVICE_ACCOUNT_JSON on Vercel\n");
}

async function cmdTestNotify(baseUrlArg, chatIdArg, senderIdArg) {
  const env = loadEnvFiles();
  const secret = env.PUSH_NOTIFY_SECRET?.trim();
  if (!secret) die("Missing PUSH_NOTIFY_SECRET in .env.local");

  let base =
    baseUrlArg ||
    env.NEXT_PUBLIC_APP_URL?.trim() ||
    (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : "") ||
    "http://localhost:3000";
  base = base.replace(/\/$/, "");

  const url = `${base}/api/push/notify`;
  const body = {
    type: "INSERT",
    schema: "public",
    table: "messages",
    record: {
      id: "00000000-0000-0000-0000-000000000001",
      chat_id: chatIdArg || "REPLACE_CHAT_UUID",
      sender_id: senderIdArg || "REPLACE_SENDER_UUID",
      content: "Test notification from scripts/push-setup.cjs",
    },
  };

  console.log(`POST ${url}`);
  console.log(
    "Tip: npm run push:test-notify -- [baseUrl] [chatUuid] [senderUuid]\n",
  );

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log("Status:", res.status);
  console.log(text);
  if (!res.ok) process.exit(1);
}

function main() {
  const [, , cmd = "help"] = process.argv;
  if (cmd === "check") return cmdCheck();
  if (cmd === "secret") return cmdSecret();
  if (cmd === "db-push") return cmdDbPush();
  if (cmd === "webhook") return cmdWebhook();
  if (cmd === "test-notify") {
    const base = process.argv[3];
    const chatId = process.argv[4];
    const senderId = process.argv[5];
    return cmdTestNotify(base, chatId, senderId).catch((e) => die(String(e)));
  }

  console.log(`
construction-egy — message push setup

  npm run push:check       — verify env files + migration + Android FCM file
  npm run push:secret      — print a random PUSH_NOTIFY_SECRET
  npm run db:push          — apply all Supabase migrations to linked remote DB
  npm run push:webhook     — print exact Supabase webhook + Vercel + Firebase steps
  npm run push:test-notify — POST a sample payload (edit chat/sender UUIDs in command)

CLI:

  node scripts/push-setup.cjs check
  node scripts/push-setup.cjs secret
  node scripts/push-setup.cjs db-push
  node scripts/push-setup.cjs webhook
  node scripts/push-setup.cjs test-notify [https://your-app.vercel.app] [chatUuid] [senderUuid]
`);
}

main();
