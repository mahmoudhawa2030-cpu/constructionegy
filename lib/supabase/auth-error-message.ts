/**
 * Maps Supabase Auth API errors to clearer user-facing text. Rate limits are enforced on the
 * server; fixing them requires Dashboard config (e.g. custom SMTP), not app code alone.
 */
type AuthLikeError = {
  message: string;
  code?: string;
  status?: number;
} | null;

const EMAIL_RATE_LIMIT_USER_MESSAGE =
  "تم بلوغ الحدّ الأقصى المسموح لإرسال رسائل التحقق من Supabase في الساعة (الخدمة الافتراضية للبريد مخصّصة للتجارب فقط). " +
  "لإصلاح ذلك في الإنتاج: لوحة Supabase → إعدادات المشروع (Project settings) → Authentication → إعداد SMTP واستخدم مزوداً مثل Resend أو SendGrid، " +
  "ثم انتظر حتى يعود الحدّ متاحاً (غالباً خلال ساعة) أو أعد المحاولة. " +
  "مرجع: https://supabase.com/docs/guides/auth/auth-smtp " +
  "English: Hosted projects hit a strict hourly cap on built-in email. Configure custom SMTP under " +
  "Supabase Dashboard → Project Settings → Authentication, wait for the window to reset, then try again.";

export function formatAuthErrorMessage(err: AuthLikeError): string {
  if (!err) return "";
  const raw = err.message?.trim() ?? "";
  const code = err.code ?? "";
  const lower = raw.toLowerCase();
  const isEmailRateLimited =
    code === OverEmailSendRateLimitCode ||
    lower.includes("email rate limit") ||
    lower.includes("rate limit exceeded") ||
    lower.includes("over_email_send_rate_limit");

  if (isEmailRateLimited) return EMAIL_RATE_LIMIT_USER_MESSAGE;
  return raw;
}

/** GoTrue error name when hourly email cap is hit (varies by version; message match is fallback). */
const OverEmailSendRateLimitCode = "over_email_send_rate_limit";
