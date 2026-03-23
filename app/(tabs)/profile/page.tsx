import Link from "next/link";

export default function ProfilePage() {
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">حسابي</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        الإعدادات والملف الشخصي — ربط لاحق ببيانات المستخدم من Supabase.
      </p>
      <div className="flex flex-col gap-3">
        <Link
          className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          href="/login"
        >
          تسجيل الدخول
        </Link>
        <Link
          className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          href="/protected"
        >
          المنطقة المحمية
        </Link>
      </div>
    </div>
  );
}
