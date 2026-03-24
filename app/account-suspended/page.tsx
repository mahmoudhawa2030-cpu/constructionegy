"use client";

import Link from "next/link";
import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

export default function AccountSuspendedPage() {
  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
    })();
  }, []);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">تم تعليق حسابك</h1>
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        تم إنهاء جلستك. إذا اعتقدت أن هذا خطأ، تواصل مع الإدارة.
      </p>
      <Link
        className="text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
        href="/login"
      >
        الذهاب لتسجيل الدخول
      </Link>
    </div>
  );
}
