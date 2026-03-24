"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { revokeOtherSessions } from "@/lib/supabase/revoke-other-sessions";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next")?.trim() || "/profile";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }
    const { error: revokeError } = await revokeOtherSessions(supabase);
    if (revokeError) {
      console.error("[auth] revoke other sessions:", revokeError);
    }
    setLoading(false);
    router.refresh();
    router.push(next.startsWith("/") ? next : "/profile");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          تسجيل الدخول
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
          أدخل البريد وكلمة المرور للمتابعة
        </p>
        <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">البريد الإلكتروني</span>
            <input
              autoComplete="email"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              name="email"
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">كلمة المرور</span>
            <input
              autoComplete="current-password"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              name="password"
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <button
            className="mt-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            disabled={loading}
            type="submit"
          >
            {loading ? "جاري الدخول…" : "دخول"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          ليس لديك حساب؟{" "}
          <Link className="font-medium text-zinc-900 underline dark:text-zinc-100" href="/signup">
            إنشاء حساب
          </Link>
        </p>
      </div>
    </div>
  );
}
