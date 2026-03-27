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

function javaBinPath(home) {
  return path.join(home, "bin", process.platform === "win32" ? "java.exe" : "java");
}

function isJdkHome(home) {
  return Boolean(home && fs.existsSync(javaBinPath(home)));
}

/**
 * Gradle needs JAVA_HOME. If unset, try Android Studio’s bundled JBR (Windows common paths).
 */
function ensureJavaHomeForGradle() {
  if (isJdkHome(process.env.JAVA_HOME)) {
    console.log("→ JAVA_HOME:", process.env.JAVA_HOME);
    return;
  }

  const candidates = [];
  if (process.platform === "win32") {
    const pf = process.env["ProgramFiles"] || "C:\\Program Files";
    const pfx86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
    const local = process.env.LOCALAPPDATA || "";
    candidates.push(
      path.join(pf, "Android", "Android Studio", "jbr"),
      path.join(pfx86, "Android", "Android Studio", "jbr"),
      path.join(local, "Programs", "Android", "Android Studio", "jbr"),
      "C:\\Program Files\\Android\\Android Studio\\jbr",
    );
  } else if (process.platform === "darwin") {
    candidates.push(
      "/Applications/Android Studio.app/Contents/jbr/Contents/Home",
      "/Applications/Android Studio.app/Contents/jre/Contents/Home",
    );
  } else {
    candidates.push("/opt/android-studio/jbr", "/usr/lib/jvm/java-17-openjdk-amd64");
  }

  for (const home of candidates) {
    if (isJdkHome(home)) {
      process.env.JAVA_HOME = home;
      const sep = path.delimiter;
      const binDir = path.join(home, "bin");
      process.env.Path = `${binDir}${sep}${process.env.Path || ""}`;
      console.log("→ JAVA_HOME not set; using:", home);
      return;
    }
  }

  console.error(`
ERROR: JAVA_HOME is not set and no JDK was found.

PowerShell (set Studio’s JDK first, then PATH — order matters):
  $env:JAVA_HOME = "C:\\Program Files\\Android\\Android Studio\\jbr"
  $env:Path = "$env:JAVA_HOME\\bin;$env:Path"
  java -version

If "java.exe" is still missing, check that folder exists in Explorer, or install JDK 17:
  https://adoptium.net/temurin/releases/?version=17
Then set JAVA_HOME to that folder (the one that contains bin\\java.exe).
`);
  process.exit(1);
}

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
  ensureJavaHomeForGradle();
  console.log("→ Building debug APK from:\n ", ANDROID + "\n");
  run(gradle, ["assembleDebug"], { cwd: ANDROID });
}

console.error("Unknown command:", cmd);
help();
process.exit(1);
