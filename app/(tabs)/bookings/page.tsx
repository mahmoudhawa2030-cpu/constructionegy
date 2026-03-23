export default function BookingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">الحجوزات</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        إدارة طلبات تأجير السقالات — ربط لاحق بجداول Supabase وحالات الطلب.
      </p>
      <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
        قائمة الحجوزات (قريباً)
      </div>
    </div>
  );
}
