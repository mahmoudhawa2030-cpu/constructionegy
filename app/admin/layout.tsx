import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_banned")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.is_banned) {
      redirect("/account-suspended");
    }
  }

  await requireAdmin();

  const t = await getTranslations("admin");

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex w-full max-w-[94.64rem] flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t("panel")}</span>
          <div className="flex flex-wrap items-center gap-3">
            <LocaleSwitcher />
            <ThemeToggle compact />
            <SignOutButton compact />
            <nav className="flex flex-wrap gap-2 text-sm">
              <Link
                className="rounded-lg px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                href="/admin"
              >
                {t("overview")}
              </Link>
              <Link
                className="rounded-lg px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                href="/admin/listings"
              >
                {t("listings")}
              </Link>
            <Link
              className="rounded-lg px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              href="/admin/users"
            >
              {t("users")}
            </Link>
            <Link
              className="rounded-lg px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              href="/admin/messages"
            >
              {t("chats")}
            </Link>
            <Link
              className="rounded-lg px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              href="/admin/categories"
            >
              {t("categories")}
            </Link>
              <Link
                className="rounded-lg px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                href="/"
              >
                {t("site")}
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-[94.64rem] flex-1 overflow-x-hidden px-4 py-6">
        {children}
      </main>
    </div>
  );
}
