export default function GalleryPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">معرض السقالات</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        صور المشاريع والسقالات — ربط لاحق بـ Supabase Storage ووحدة الكاميرا لالتقاط الصور من الجهاز.
      </p>
      <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
        منطقة عرض الصور (قريباً)
      </div>
    </div>
  );
}
