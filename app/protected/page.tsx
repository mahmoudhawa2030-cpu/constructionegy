import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/login");
  }

  const { sub, email } = data.claims;

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          صفحة محمية
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          تم التحقق من الجلسة عبر <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">getClaims()</code>{" "}
          على الخادم.
        </p>
        <dl className="mt-6 space-y-3 text-sm">
          <div>
            <dt className="font-medium text-zinc-500 dark:text-zinc-400">المعرّف</dt>
            <dd className="mt-0.5 break-all font-mono text-zinc-900 dark:text-zinc-100">{sub}</dd>
          </div>
          {email ? (
            <div>
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">البريد</dt>
              <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">{email}</dd>
            </div>
          ) : null}
        </dl>
        <div className="mt-8">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
