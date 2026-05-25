import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { adminUi } from "@/lib/admin-ui";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { getStorageBaseUrl } from "@/lib/supabase/desktop-category-icon-url";
import { MediaGrid } from "./media-grid";

export const dynamic = "force-dynamic";

const IMAGE_BUCKETS = [
  { id: "homepage-hero-images", label: "Hero Slider Images" },
  { id: "homepage-desktop-category-icons", label: "Desktop Category Icons" },
];

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif", "svg", "avif"]);

function extOf(name: string): string {
  return (name.split(".").pop() ?? "").toLowerCase();
}

function isImage(name: string): boolean {
  return IMAGE_EXTS.has(extOf(name));
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export type MediaFile = {
  bucket: string;
  bucketLabel: string;
  path: string;
  name: string;
  ext: string;
  size: number;
  sizeLabel: string;
  publicUrl: string;
  createdAt: string | null;
};

export default async function AdminMediaPage() {
  await requireAdmin();
  const t = await getTranslations("adminMedia");
  const supabase = await createClient();
  const base = getStorageBaseUrl();

  const allFiles: MediaFile[] = [];

  for (const bucket of IMAGE_BUCKETS) {
    const { data: items, error } = await supabase.storage.from(bucket.id).list("", {
      limit: 1000,
      offset: 0,
      sortBy: { column: "created_at", order: "desc" },
    });

    if (error || !items) continue;

    // Recursively collect files from sub-folders (Supabase returns folders as items with no metadata)
    const queue = items.map((item) => ({ item, prefix: "" }));
    const visited: Array<{ prefix: string; name: string }> = [];

    while (queue.length > 0) {
      const entry = queue.shift();
      if (!entry) break;
      const { item, prefix } = entry;
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;

      if (!item.metadata) {
        // It's a folder — list its contents
        const { data: sub } = await supabase.storage.from(bucket.id).list(fullPath, {
          limit: 1000,
          offset: 0,
          sortBy: { column: "created_at", order: "desc" },
        });
        for (const s of sub ?? []) {
          queue.push({ item: s, prefix: fullPath });
        }
      } else {
        visited.push({ prefix, name: item.name });
        const ext = extOf(item.name);
        if (!isImage(item.name)) continue;
        const size = item.metadata?.size ?? 0;
        const enc = fullPath.split("/").map(encodeURIComponent).join("/");
        const publicUrl = `${base}/${bucket.id}/${enc}`;
        allFiles.push({
          bucket: bucket.id,
          bucketLabel: bucket.label,
          path: fullPath,
          name: item.name,
          ext,
          size,
          sizeLabel: fmtBytes(size),
          publicUrl,
          createdAt: item.metadata?.lastModified ?? null,
        });
      }
    }
  }

  const totalSize = allFiles.reduce((s, f) => s + f.size, 0);

  return (
    <div className={adminUi.page}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={adminUi.pageTitle}>{t("title")}</h1>
          <p className={adminUi.pageLead}>{t("lead")}</p>
        </div>
        <Link className={adminUi.linkBack} href="/admin">
          {t("backAdmin")}
        </Link>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-4">
        <div className={`${adminUi.card} flex flex-col gap-0.5 px-5 py-3`}>
          <span className={adminUi.footnote}>{t("totalFiles")}</span>
          <span className="text-2xl font-bold tabular-nums text-[var(--admin-text)]">
            {allFiles.length}
          </span>
        </div>
        <div className={`${adminUi.card} flex flex-col gap-0.5 px-5 py-3`}>
          <span className={adminUi.footnote}>{t("totalSize")}</span>
          <span className="text-2xl font-bold tabular-nums text-[var(--admin-text)]">
            {fmtBytes(totalSize)}
          </span>
        </div>
        {IMAGE_BUCKETS.map((b) => (
          <div key={b.id} className={`${adminUi.card} flex flex-col gap-0.5 px-5 py-3`}>
            <span className={adminUi.footnote}>{b.label}</span>
            <span className="text-2xl font-bold tabular-nums text-[var(--admin-text)]">
              {allFiles.filter((f) => f.bucket === b.id).length}
            </span>
          </div>
        ))}
      </div>

      {allFiles.length === 0 ? (
        <p className="text-sm text-[var(--admin-text-secondary)]">{t("empty")}</p>
      ) : (
        <MediaGrid files={allFiles} />
      )}
    </div>
  );
}
