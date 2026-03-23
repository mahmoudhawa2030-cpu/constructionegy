# Capacitor (Web + iOS + Android)

This app keeps **one Next.js codebase** deployed on **Vercel**. The native shell loads that URL in a WebView via `server.url` in [`capacitor.config.ts`](../capacitor.config.ts) when `CAPACITOR_SERVER_URL` or `NEXT_PUBLIC_APP_URL` is set.

## One-time setup

1. Copy `.env.example` → `.env.local` and set `NEXT_PUBLIC_APP_URL` to your production URL (e.g. `https://your-app.vercel.app`).
2. Install dependencies: `npm install`
3. Add native platforms (macOS required for iOS):
   - `npm run cap:add:android`
   - `npm run cap:add:ios`
4. After dependency or config changes: `npm run cap:sync`
5. Open IDEs:
   - `npm run cap:open:android`
   - `npm run cap:open:ios`

## Dev on device / emulator

Point the WebView at your machine:

- **Android emulator:** often `http://10.0.2.2:3000` (maps to host `localhost`)
- **iOS simulator:** `http://localhost:3000`
- **Physical device:** use your PC’s LAN IP, e.g. `http://192.168.1.x:3000`

Set `CAPACITOR_SERVER_URL` in `.env.local` before `cap sync`, or export it in the shell for that session. Use **http** only with `cleartext` (see config); production should use **https**.

## Push notifications

FCM (Android) and APNs (iOS) require extra project files and dashboard setup. The app registers in [`components/capacitor-bridge.tsx`](../components/capacitor-bridge.tsx); until keys are configured, registration may fail silently in production builds.

## Optional: ignore native folders

To regenerate `ios/` and `android/` on each machine instead of committing them, add `/ios` and `/android` to `.gitignore`. For store releases, committing these folders is common so builds stay reproducible.
