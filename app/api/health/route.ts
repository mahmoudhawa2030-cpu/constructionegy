import { NextResponse } from "next/server";

/**
 * Public diagnostics for deployments (e.g. Vercel). Does not bypass the Supabase
 * proxy — `proxy.ts` matcher excludes this path so env is readable even when
 * Supabase env is missing (otherwise the proxy would return 503 first).
 */
export const dynamic = "force-dynamic";

export function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
    "";

  return NextResponse.json({
    ok: Boolean(url && key),
    hasNextPublicSupabaseUrl: Boolean(url),
    hasNextPublicSupabaseKey: Boolean(key),
    vercelEnv: process.env.VERCEL_ENV ?? null,
    nodeEnv: process.env.NODE_ENV,
  });
}
