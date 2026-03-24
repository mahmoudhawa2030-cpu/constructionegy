import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  /** When set, renders a link (typically not used for the last item). */
  href?: string;
};

type Props = {
  items: BreadcrumbItem[];
};

export function Breadcrumb({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="مسار التنقل" className="text-sm">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-zinc-600 dark:text-zinc-400">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex min-w-0 max-w-full items-center gap-x-1.5">
              {index > 0 ? (
                <span className="shrink-0 text-zinc-400 dark:text-zinc-600" aria-hidden>
                  /
                </span>
              ) : null}
              {item.href && !isLast ? (
                <Link
                  className="shrink-0 font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={
                    isLast
                      ? "min-w-0 truncate font-medium text-zinc-900 dark:text-zinc-50"
                      : "min-w-0 truncate text-zinc-600 dark:text-zinc-400"
                  }
                  title={item.label.length > 48 ? item.label : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
