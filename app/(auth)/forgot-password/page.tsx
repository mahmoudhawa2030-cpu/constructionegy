import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");
  return (
    <Suspense fallback={<p className="px-4 py-16 text-center text-sm text-zinc-500">{t("loading")}</p>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
