"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { revokeOtherSessions } from "@/lib/supabase/revoke-other-sessions";

const OTP_LENGTH = 6;

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"details" | "otp">("details");
  const [pendingEmail, setPendingEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim() || undefined,
        },
      },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      const { error: revokeError } = await revokeOtherSessions(supabase);
      if (revokeError) {
        console.error("[auth] revoke other sessions:", revokeError);
      }
      router.refresh();
      router.push("/profile");
      return;
    }
    if (data.user) {
      setPendingEmail(email);
      setPassword("");
      setOtp("");
      setStep("otp");
      setMessage("أدخل رمز التحقق المكوّن من 6 أرقام المرسل إلى بريدك.");
      return;
    }
    setMessage("تحقق من بريدك أو إعدادات المشروع في Supabase.");
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const token = otp.replace(/\D/g, "");
    if (token.length !== OTP_LENGTH) {
      setError(`الرمز يجب أن يكون ${OTP_LENGTH} أرقاماً.`);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: pendingEmail,
      token,
      type: "signup",
    });
    setLoading(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    if (data.session) {
      const { error: revokeError } = await revokeOtherSessions(supabase);
      if (revokeError) {
        console.error("[auth] revoke other sessions:", revokeError);
      }
      router.refresh();
      router.push("/profile");
      return;
    }
    setError("لم يكتمل تسجيل الدخول. حاول مرة أخرى.");
  }

  async function handleResendOtp() {
    setError(null);
    setMessage(null);
    setLoading(true);
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: pendingEmail,
    });
    setLoading(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setMessage("أُعيد إرسال الرمز إلى بريدك.");
  }

  function goBackToDetails() {
    setStep("details");
    setOtp("");
    setPendingEmail("");
    setError(null);
    setMessage(null);
  }

  if (step === "otp") {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">تأكيد البريد</h1>
          <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
            أدخل الرمز المرسل إلى{" "}
            <span className="font-medium text-zinc-800 dark:text-zinc-200" dir="ltr">
              {pendingEmail}
            </span>
          </p>
          <form className="mt-8 flex flex-col gap-4" onSubmit={handleVerifyOtp}>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-zinc-700 dark:text-zinc-300">رمز التحقق</span>
              <input
                autoComplete="one-time-code"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-center font-mono text-lg tracking-[0.35em] text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                dir="ltr"
                inputMode="numeric"
                maxLength={OTP_LENGTH}
                name="otp"
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
                placeholder="••••••"
                type="text"
                value={otp}
              />
            </label>
            {error ? (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="text-sm text-emerald-700 dark:text-emerald-400" role="status">
                {message}
              </p>
            ) : null}
            <button
              className="mt-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              disabled={loading}
              type="submit"
            >
              {loading ? "جاري التحقق…" : "تأكيد"}
            </button>
          </form>
          <div className="mt-4 flex flex-col gap-2 text-center text-sm">
            <button
              className="text-zinc-600 underline disabled:opacity-50 dark:text-zinc-400"
              disabled={loading}
              type="button"
              onClick={() => void handleResendOtp()}
            >
              إعادة إرسال الرمز
            </button>
            <button
              className="text-zinc-500 dark:text-zinc-500"
              disabled={loading}
              type="button"
              onClick={goBackToDetails}
            >
              ← العودة لتعديل البيانات
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">إنشاء حساب</h1>
        <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
          سجّل بريداً وكلمة مرور لبدء الاستخدام
        </p>
        <form className="mt-8 flex flex-col gap-4" onSubmit={handleSignUp}>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">الاسم الظاهر</span>
            <input
              autoComplete="name"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              name="full_name"
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: أحمد محمد"
              type="text"
              value={fullName}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">البريد الإلكتروني</span>
            <input
              autoComplete="email"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              name="email"
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">كلمة المرور</span>
            <input
              autoComplete="new-password"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              minLength={6}
              name="password"
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="text-sm text-emerald-700 dark:text-emerald-400" role="status">
              {message}
            </p>
          ) : null}
          <button
            className="mt-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            disabled={loading}
            type="submit"
          >
            {loading ? "جاري الإنشاء…" : "إنشاء الحساب"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          لديك حساب بالفعل؟{" "}
          <Link className="font-medium text-zinc-900 underline dark:text-zinc-100" href="/login">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
