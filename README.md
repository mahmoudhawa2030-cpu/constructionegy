This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Message push (Android FCM + in-app)

Automated checklist (env, migration, webhook steps, Firebase paths):

```bash
npm run push:setup
npm run push:check
npm run push:secret
npm run db:push
npm run push:webhook
```

Apply migrations to your Supabase project (`npx supabase link` first if needed), add `google-services.json` under `android/app/`, set `PUSH_NOTIFY_SECRET`, `FIREBASE_SERVICE_ACCOUNT_JSON`, and `SUPABASE_SERVICE_ROLE_KEY` on Vercel, then create the **Database Webhook** on `public.messages` INSERT as printed by `npm run push:webhook`. See `.env.example`.

## Android app on your phone (step-by-step)

Do this on your **Windows PC** after you change code or run `npm install` (plugins need sync).

1. Open **PowerShell** (normal user is fine; avoid starting in `System32` if it confuses you).

2. Go to the project (adjust the path if yours differs):

   ```powershell
   cd D:\My-business\construction-egy
   ```

3. Install JS deps (if you have not yet):

   ```powershell
   npm install
   ```

4. Sync Capacitor into the Android project (**use this; it always runs from the correct folder**):

   ```powershell
   npm run android:sync
   ```

5. **Either** open Android Studio and tap Run ▶:

   ```powershell
   npm run android:open
   ```

   **Or** build a debug APK without Studio:

   ```powershell
   npm run android:apk-debug
   ```

   Then copy the file  
   `android\app\build\outputs\apk\debug\app-debug.apk`  
   to your phone and open it to install (enable “Install unknown apps” if asked).

6. On the phone, when Android asks for **notifications**, tap **Allow**.

**If `npm run android:sync` ever fails**, you can run the same thing **from any directory** (full path to your clone):

```powershell
node D:\My-business\construction-egy\scripts\android-run.cjs sync
```

We **cannot** install the APK on your phone or click Run in Android Studio for you—those two steps have to happen on your machine/device.
