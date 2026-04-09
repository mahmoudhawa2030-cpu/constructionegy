"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { safeAuthNextPath } from "@/lib/auth/safe-redirect-path";
import { createClient } from "@/lib/supabase/client";

/**
 * PKCE recovery: exchange must run in the **browser** with `createBrowserClient` so the PKCE code verifier
 * (stored in this origin’s cookies when the user clicked “Forgot password”) is visible. Server `route.ts`
 * often fails because `request.cookies` does not reliably carry the same chunked verifier Supabase writes.
 */
export function AuthCallbackClient() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const oauthError = searchParams.get("error");
    const oauthDesc = searchParams.get("error_description");
    const nextPath = safeAuthNextPath(searchParams.get("next"), "/update-password");

    if (oauthError) {
      setError(oauthError === "access_denied" ? "access_denied" : oauthDesc?.trim() || oauthError);
      return;
    }

    if (!code) {
      setError("missing_code");
      return;
    }

    const doneKey = `cegy_pkce_done_${code}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(doneKey) === "1") {
      router.replace(nextPath);
      return;
    }

    let cancelled = false;
    const supabase = createClient();

    void (async () => {
      const { data: existing } = await supabase.auth.getSession();
      if (cancelled) return;
      if (existing.session) {
        try {
          sessionStorage.setItem(doneKey, "1");
        } catch {
          /* ignore */
        }
        router.replace(nextPath);
        return;
      }
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (cancelled) return;
      if (exchangeError) {
        setError(exchangeError.message);
        return;
      }
      try {
        sessionStorage.setItem(doneKey, "1");
      } catch {
        /* ignore */
      }
      router.replace(nextPath);
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error === "missing_code"
              ? t("authCallbackMissingCode")
              : error === "access_denied"
                ? t("authCallbackAccessDenied")
                : t("authCallbackExchangeFailed", { message: error.slice(0, 280) })}
          </p>
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{t("forgotPasswordRecoveryFailed")}</p>
          <p className="mt-6 text-sm">
            <Link className="font-medium text-zinc-900 underline dark:text-zinc-100" href="/forgot-password">
              {t("forgotPasswordTitle")}
            </Link>
            {" · "}
            <Link className="font-medium text-zinc-900 underline dark:text-zinc-100" href="/login">
              {t("forgotPasswordBackToLogin")}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("loading")}</p>
    </div>
  );
}
