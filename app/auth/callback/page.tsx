import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { AuthCallbackClient } from "@/components/auth-callback-client";

export default async function AuthCallbackPage() {
  const t = await getTranslations("auth");
  return (
    <Suspense fallback={<p className="px-4 py-16 text-center text-sm text-zinc-500">{t("loading")}</p>}>
      <AuthCallbackClient />
    </Suspense>
  );
}
