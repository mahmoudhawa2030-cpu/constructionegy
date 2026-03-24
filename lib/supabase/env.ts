/**
 * Public Supabase URL + anon/publishable key (browser + server).
 * Must be set in `.env.local` at the repo root (same folder as `package.json`).
 */
export function getSupabasePublicEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
    "";

  if (!url || !key) {
    const missing: string[] = [];
    if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!key) {
      missing.push(
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY",
      );
    }
    throw new Error(
      `[Supabase] Missing environment variables: ${missing.join(", ")}.\n\n` +
        "Local: create or edit `.env.local` in the project root (next to package.json), add:\n" +
        "  NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co\n" +
        "  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here\n\n" +
        "Vercel: Project → Settings → Environment Variables — add the same keys for Production " +
        "(and Preview if you use it), then Redeploy.\n\n" +
        "Then restart the dev server locally (Ctrl+C, then npm run dev).",
    );
  }

  return { url, key };
}
