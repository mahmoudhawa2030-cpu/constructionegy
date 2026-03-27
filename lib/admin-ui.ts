/**
 * SAP BusinessObjects / dashboard-style admin UI.
 * Structural classes; colors & table/widget chrome live in `app/globals.css` (`.admin-app`).
 */
export const adminUi = {
  shell: "admin-app flex min-h-full flex-col antialiased",
  brandBar: "admin-brand-stripe shrink-0",
  header: "admin-shell-header sticky top-0 z-50",
  headerInner:
    "mx-auto flex w-full max-w-[120rem] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
  headerTitle:
    "text-base font-semibold tracking-tight text-[var(--admin-table-header-text)]",
  headerTools: "flex flex-wrap items-center gap-2",
  main: "mx-auto w-full max-w-[120rem] flex-1 px-4 py-6",
  page: "flex flex-col gap-6",
  pageTitle:
    "text-xl font-semibold tracking-tight text-[var(--admin-table-header-text)]",
  pageLead: "mt-1 max-w-3xl text-sm leading-relaxed text-[var(--admin-text-secondary)]",
  linkEmphasized: "text-sm font-semibold text-[var(--admin-brand)] hover:underline",
  linkBack: "text-sm font-semibold text-[var(--admin-brand)] hover:underline",

  /** Dashboard widget: gradient header + body (see globals `.admin-widget`) */
  widget: "admin-widget rounded-sm",
  widgetHeader: "admin-widget-header",
  widgetBody: "admin-widget-body",
  /** Widget body with no padding (full-bleed table) */
  widgetBodyFlush: "admin-widget-body p-0",

  /** Legacy card (forms): white panel + border */
  card: "rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-card-bg)] shadow-[0_1px_3px_rgba(15,45,74,0.1)]",
  cardPadded:
    "rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-card-bg)] p-5 shadow-[0_1px_3px_rgba(15,45,74,0.1)]",

  sectionTitle:
    "text-base font-semibold text-[var(--admin-table-header-text)]",
  sectionLead: "mt-1 text-sm text-[var(--admin-text-secondary)]",

  kpiGrid: "mt-6 grid gap-4 sm:grid-cols-3",
  kpiAccent: "admin-kpi-box admin-kpi-box--accent rounded-sm p-5 transition hover:brightness-[1.02]",
  kpiNeutral: "admin-kpi-box rounded-sm p-5 transition hover:brightness-[1.02]",
  kpiLabel: "text-sm font-semibold text-[var(--admin-text-secondary)]",
  kpiValue:
    "mt-1 text-3xl font-bold tabular-nums text-[var(--admin-text)] tracking-tight",

  gridTwo: "grid gap-4 lg:grid-cols-2",

  objectLink:
    "block w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-zebra-even)] px-3 py-2.5 text-sm font-semibold text-[var(--admin-text)] shadow-sm transition hover:border-[var(--admin-brand)] hover:bg-white",

  placeholderTile:
    "rounded-sm border border-dashed border-[var(--admin-shell-border)] bg-[var(--admin-zebra-odd)] px-3 py-2.5 text-sm text-[var(--admin-text-secondary)]",

  /** Tables: wrap uses `.admin-table-wrap` + `.admin-table` from globals */
  tableWrap: "admin-table-wrap overflow-x-auto rounded-sm",
  table: "admin-table text-start",
  theadRow: "",
  th: "",
  tbodyRow: "",
  td: "",
  tdMuted: "text-[var(--admin-text-secondary)]",

  messageStripInfo:
    "rounded-sm border-s-4 border-[var(--admin-brand)] bg-[var(--admin-card-bg)] px-4 py-3 text-sm shadow-sm ring-1 ring-[var(--admin-cell-border)]",
  messageStripWarn:
    "rounded-sm border-s-4 border-amber-600 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-100",

  label: "text-sm font-semibold text-[var(--admin-text)]",
  input:
    "rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-text-secondary)] focus:border-[var(--admin-brand)] focus:ring-1 focus:ring-[var(--admin-brand)]",
  inputMono:
    "rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 font-mono text-sm text-[var(--admin-text)] outline-none focus:border-[var(--admin-brand)] focus:ring-1 focus:ring-[var(--admin-brand)]",
  select:
    "rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-2 py-1.5 text-xs text-[var(--admin-text)] outline-none focus:border-[var(--admin-brand)] focus:ring-1 focus:ring-[var(--admin-brand)]",
  checkbox:
    "rounded-sm border-[var(--admin-cell-border)] text-[var(--admin-brand)]",

  btnPrimary:
    "inline-flex items-center justify-center rounded-sm border border-[var(--admin-brand-press)] bg-gradient-to-b from-[var(--admin-brand-soft)] to-[var(--admin-brand)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-[var(--admin-brand)] hover:to-[var(--admin-brand-press)] disabled:opacity-50",
  btnSecondary:
    "inline-flex items-center justify-center rounded-sm border border-[var(--admin-shell-border)] bg-gradient-to-b from-white to-[#e8eef6] px-3 py-1.5 text-xs font-semibold text-[var(--admin-table-header-text)] shadow-sm hover:to-[#dce6f0] disabled:opacity-50 dark:from-zinc-700 dark:to-zinc-800 dark:text-zinc-100",
  btnToolbar:
    "inline-flex items-center justify-center rounded-sm border border-[var(--admin-shell-border)] bg-gradient-to-b from-white to-[#e8eef6] px-3 py-2 text-sm font-semibold text-[var(--admin-table-header-text)] hover:to-[#dce6f0] dark:from-zinc-700 dark:to-zinc-800 dark:text-zinc-100",
  btnGhost:
    "inline-flex items-center justify-center rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-card-bg)] px-2 py-1 text-xs font-semibold text-[var(--admin-text)] hover:bg-[var(--admin-zebra-odd)]",
  btnAttention:
    "inline-flex items-center justify-center rounded-sm border border-amber-500 bg-gradient-to-b from-amber-50 to-amber-100/90 px-2 py-1 text-xs font-semibold text-amber-950 hover:to-amber-200/80 dark:border-amber-600 dark:from-amber-950/50 dark:to-amber-950/70 dark:text-amber-100",
  btnDanger:
    "inline-flex items-center justify-center rounded-sm border border-red-400 bg-gradient-to-b from-red-50 to-red-100/80 px-2.5 py-1.5 text-xs font-semibold text-red-900 hover:to-red-200/80 dark:border-red-700 dark:from-red-950/45 dark:to-red-950/60 dark:text-red-100",

  code: "rounded-sm bg-[var(--admin-zebra-odd)] px-1.5 py-0.5 font-mono text-xs text-[var(--admin-text)] ring-1 ring-[var(--admin-cell-border)]",
  footnote: "text-xs text-[var(--admin-text-secondary)]",

  threadShell:
    "flex flex-col gap-3 rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-zebra-odd)] p-4",
  messageCard:
    "rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-card-bg)] px-3 py-2 text-sm shadow-sm",
} as const;
