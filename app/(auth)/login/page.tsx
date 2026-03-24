import { Suspense } from "react";

import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16 text-sm text-zinc-500">
          جاري التحميل…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
