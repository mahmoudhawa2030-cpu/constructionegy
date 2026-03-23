import type { CapacitorConfig } from "@capacitor/cli";

/**
 * WebView loads NEXT_PUBLIC_APP_URL (e.g. Vercel) when set; otherwise local `webDir` assets.
 * For dev on device/emulator set CAPACITOR_SERVER_URL e.g. http://10.0.2.2:3000 (Android emu) or http://localhost:3000 (iOS sim).
 */
const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  "";

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
