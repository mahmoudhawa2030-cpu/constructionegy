import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const t = await getTranslations("auth");
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16 text-sm text-zinc-500">
          {t("loading")}
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
