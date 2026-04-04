"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const origin =
      typeof window !== "undefined"
        ? `${window.location.origin.replace(/\/$/, "")}/update-password`
        : "";
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: origin,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {t("forgotPasswordTitle")}
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
          {t("forgotPasswordSubtitle")}
        </p>
        {sent ? (
          <p className="mt-8 text-center text-sm text-zinc-700 dark:text-zinc-300" role="status">
            {t("forgotPasswordSuccess")}
          </p>
        ) : (
          <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-zinc-700 dark:text-zinc-300">{t("email")}</span>
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
              {loading ? t("forgotPasswordSubmitting") : t("forgotPasswordSubmit")}
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          <Link
            className="font-medium text-zinc-900 underline dark:text-zinc-100"
            href="/login"
          >
            {t("forgotPasswordBackToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
