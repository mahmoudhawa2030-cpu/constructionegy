import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { UpdatePasswordForm } from "@/components/update-password-form";

export default async function UpdatePasswordPage() {
  const t = await getTranslations("auth");
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16 text-sm text-zinc-500">
          {t("loading")}
        </div>
      }
    >
      <UpdatePasswordForm />
    </Suspense>
  );
}
