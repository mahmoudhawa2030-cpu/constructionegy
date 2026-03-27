#!/usr/bin/env node
/**
 * Run Capacitor / Gradle from repo root even if your terminal started in C:\Windows\System32.
 *
 * Usage (from ANY directory):
 *   node path/to/construction-egy/scripts/android-run.cjs sync
 *   node path/to/construction-egy/scripts/android-run.cjs open
 *   node path/to/construction-egy/scripts/android-run.cjs assemble-debug
 *
 * Or from repo root:
 *   npm run android:sync
 *   npm run android:open
 *   npm run android:apk-debug
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ANDROID = path.join(ROOT, "android");

function ensureRoot() {
  if (!fs.existsSync(path.join(ROOT, "package.json"))) {
    console.error("Could not find project root at:", ROOT);
    process.exit(1);
  }
  process.chdir(ROOT);
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: true,
    ...opts,
  });
  if (r.error) {
    console.error(r.error.message);
    process.exit(1);
  }
  process.exit(r.status === null ? 1 : r.status);
}

function help() {
  console.log(`
Android helper (always uses project folder: ${ROOT})

  npm run android:sync       Copy web assets + update Android plugins (run after git pull / npm install)
  npm run android:open       Open Android Studio (click Run ▶ to install on phone)
  npm run android:apk-debug  Build debug APK (no Studio needed)

From any folder (replace with your path):
  node ${path.join(ROOT, "scripts", "android-run.cjs")} sync
  node ${path.join(ROOT, "scripts", "android-run.cjs")} open
  node ${path.join(ROOT, "scripts", "android-run.cjs")} assemble-debug

After assemble-debug, install on phone:
  ${path.join("android", "app", "build", "outputs", "apk", "debug", "app-debug.apk")}

Or with USB debugging:
  adb install -r android\\\\app\\\\build\\\\outputs\\\\apk\\\\debug\\\\app-debug.apk
`);
}

const [, , cmd = "help"] = process.argv;
ensureRoot();

if (cmd === "help" || cmd === "-h") {
  help();
  process.exit(0);
}

if (cmd === "sync") {
  console.log("→ Running Capacitor sync (android) from:\n ", ROOT + "\n");
  run("npx", ["cap", "sync", "android"]);
}

if (cmd === "open") {
  console.log("→ Opening Android Studio from:\n ", ROOT + "\n");
  run("npx", ["cap", "open", "android"]);
}

if (cmd === "assemble-debug") {
  const win = process.platform === "win32";
  const gradle = win ? "gradlew.bat" : "./gradlew";
  if (!fs.existsSync(path.join(ANDROID, win ? "gradlew.bat" : "gradlew"))) {
    console.error("Missing Gradle wrapper in", ANDROID);
    process.exit(1);
  }
  console.log("→ Building debug APK from:\n ", ANDROID + "\n");
  run(gradle, ["assembleDebug"], { cwd: ANDROID });
}

console.error("Unknown command:", cmd);
help();
process.exit(1);
