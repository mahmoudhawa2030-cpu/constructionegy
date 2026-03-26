import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/users/myads");
  }

  const t = await getTranslations("home");
  const tCommon = await getTranslations("common");

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt={tCommon("brandAlt")}
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-start">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            {t("intro")}
          </p>
        </div>
        <nav className="flex flex-col gap-3 text-base font-medium sm:flex-row sm:flex-wrap sm:gap-4">
          <Link
            className="flex h-12 w-full items-center justify-center rounded-full bg-zinc-900 px-5 text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 md:w-auto"
            href="/login"
          >
            {t("login")}
          </Link>
          <Link
            className="flex h-12 w-full items-center justify-center rounded-full border border-zinc-300 bg-white px-5 text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 md:w-auto"
            href="/signup"
          >
            {t("signup")}
          </Link>
          <Link
            className="flex h-12 w-full items-center justify-center rounded-full border border-zinc-300 bg-white px-5 text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 md:w-auto"
            href="/gallery"
          >
            {t("gallery")}
          </Link>
        </nav>
      </main>
    </div>
  );
}
