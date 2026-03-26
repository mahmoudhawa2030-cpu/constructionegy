/**
 * Must match Supabase → Authentication (email OTP length in project settings).
 * Built-in default in the app is 8; set NEXT_PUBLIC_AUTH_EMAIL_OTP_LENGTH=6 if your project still sends 6 digits.
 */
const MIN = 6;
const MAX = 12;

export function getEmailOtpLength(): number {
  const raw = process.env.NEXT_PUBLIC_AUTH_EMAIL_OTP_LENGTH?.trim();
  if (raw) {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n >= MIN && n <= MAX) return n;
  }
  return 8;
}
