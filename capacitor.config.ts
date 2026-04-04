import type { CapacitorConfig } from "@capacitor/cli";

import { DEFAULT_PUBLIC_APP_URL } from "./lib/public-app-url";

/**
 * WebView loads NEXT_PUBLIC_APP_URL (e.g. Vercel) when set during `npx cap sync`.
 * Override with CAPACITOR_SERVER_URL for local dev (e.g. http://10.0.2.2:3000 on Android emulator).
 * If both are unset, falls back to production so the native shell never shows `public/cap-web` placeholder only.
 */
const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  DEFAULT_PUBLIC_APP_URL;

function allowNavigationFor(url: string): string[] {
  try {
    const { origin } = new URL(url);
    return [origin];
  } catch {
    return [];
  }
}

const config: CapacitorConfig = {
  appId: "com.constructionegy.app",
  appName: "construction-egy",
  webDir: "public/cap-web",
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: serverUrl.startsWith("http:"),
        allowNavigation: allowNavigationFor(serverUrl),
      }
    : undefined,
  android: {
    allowMixedContent: true,
  },
  ios: {
    scheme: "App",
  },
};

export default config;
