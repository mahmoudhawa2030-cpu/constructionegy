/**
 * SAP Fiori Horizon–inspired styling for the admin area.
 * Uses CSS variables set on `.admin-app` in `app/globals.css`.
 */
export const adminUi = {
  shell:
    "admin-app flex min-h-full flex-col bg-[var(--admin-page-bg)] text-[var(--admin-text)] antialiased",
  brandBar: "h-1 shrink-0 bg-[var(--admin-brand)]",
  header:
    "sticky top-0 z-50 border-b border-[var(--admin-shell-border)] bg-[var(--admin-header-bg)] shadow-[0_1px_0_0_rgba(0,0,0,0.05)]",
  headerInner:
    "mx-auto flex w-full max-w-[120rem] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
  headerTitle: "text-base font-semibold tracking-tight text-[var(--admin-text)]",
  headerTools: "flex flex-wrap items-center gap-2",
  main: "mx-auto w-full max-w-[120rem] flex-1 px-4 py-6",
  /** Object-page style vertical rhythm */
  page: "flex flex-col gap-6",
  pageTitle: "text-xl font-semibold tracking-tight text-[var(--admin-text)]",
  pageLead: "mt-1 max-w-3xl text-sm leading-relaxed text-[var(--admin-text-secondary)]",
  linkEmphasized: "text-sm font-semibold text-[var(--admin-brand)] hover:underline",
  linkBack: "text-sm font-medium text-[var(--admin-brand)] hover:underline",
  /** Cards & panels */
  card: "rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-card-bg)] shadow-sm",
  cardPadded:
    "rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-card-bg)] p-5 shadow-sm",
  sectionTitle: "text-base font-semibold text-[var(--admin-text)]",
  sectionLead: "mt-1 text-sm text-[var(--admin-text-secondary)]",
  /** KPI tiles */
  kpiGrid: "mt-6 grid gap-4 sm:grid-cols-3",
  kpiAccent:
    "rounded-sm border border-amber-300/80 bg-amber-50 p-5 shadow-sm transition hover:border-amber-400 dark:border-amber-700 dark:bg-amber-950/35",
  kpiNeutral:
    "rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-card-bg)] p-5 shadow-sm",
  kpiLabel: "text-sm font-medium text-[var(--admin-text-secondary)]",
  kpiValue: "mt-1 text-3xl font-semibold tabular-nums text-[var(--admin-text)]",
  gridTwo: "grid gap-4 lg:grid-cols-2",
  /** List / object links */
  objectLink:
    "block w-full rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-card-bg)] px-4 py-3 text-sm font-semibold text-[var(--admin-text)] shadow-sm transition hover:border-[var(--admin-brand)] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand)]",
  placeholderTile:
    "rounded-sm border border-dashed border-[var(--admin-shell-border)] bg-[var(--admin-page-bg)] px-4 py-3 text-sm text-[var(--admin-text-secondary)]",
  /** Tables (responsive shell) */
  tableWrap:
    "overflow-x-auto rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-card-bg)] shadow-sm",
  table: "w-full min-w-max text-start text-sm",
  theadRow: "border-b border-[var(--admin-shell-border)] bg-[var(--admin-table-header-bg)]",
  th: "whitespace-nowrap px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-[var(--admin-text-secondary)]",
  tbodyRow:
    "border-b border-[var(--admin-shell-border)] last:border-0 hover:bg-[var(--admin-row-hover)]",
  td: "px-3 py-2 align-middle text-[var(--admin-text)]",
  tdMuted: "px-3 py-2 align-middle text-[var(--admin-text-secondary)]",
  /** Message strip (SAP-style) */
  messageStripInfo:
    "rounded-sm border-s-4 border-[var(--admin-brand)] bg-[var(--admin-card-bg)] px-4 py-3 text-sm shadow-sm ring-1 ring-[var(--admin-shell-border)]",
  messageStripWarn:
    "rounded-sm border-s-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-600 dark:bg-amber-950/35 dark:text-amber-100",
  /** Form controls */
  label: "text-sm font-medium text-[var(--admin-text)]",
  input:
    "rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-text-secondary)] focus:border-[var(--admin-brand)] focus:ring-1 focus:ring-[var(--admin-brand)]",
  inputMono:
    "rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-field-bg)] px-3 py-2 font-mono text-sm text-[var(--admin-text)] outline-none focus:border-[var(--admin-brand)] focus:ring-1 focus:ring-[var(--admin-brand)]",
  select:
    "rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-field-bg)] px-2 py-1.5 text-xs text-[var(--admin-text)] outline-none focus:border-[var(--admin-brand)] focus:ring-1 focus:ring-[var(--admin-brand)]",
  checkbox: "rounded-sm border-[var(--admin-shell-border)] text-[var(--admin-brand)]",
  /** Buttons */
  btnPrimary:
    "inline-flex items-center justify-center rounded-sm bg-[var(--admin-brand)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[var(--admin-brand-press)] disabled:opacity-50",
  btnSecondary:
    "inline-flex items-center justify-center rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-card-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--admin-text)] shadow-sm hover:bg-[var(--admin-row-hover)] disabled:opacity-50",
  btnToolbar:
    "inline-flex items-center justify-center rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm font-semibold text-[var(--admin-text)] hover:bg-[var(--admin-row-hover)]",
  btnGhost:
    "inline-flex items-center justify-center rounded-sm border border-[var(--admin-shell-border)] bg-transparent px-2 py-1 text-xs font-semibold text-[var(--admin-text)] hover:bg-[var(--admin-row-hover)]",
  btnAttention:
    "inline-flex items-center justify-center rounded-sm border border-amber-400 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-950 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100",
  btnDanger:
    "inline-flex items-center justify-center rounded-sm border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-900 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/45 dark:text-red-100",
  /** Misc */
  code: "rounded-sm bg-[var(--admin-table-header-bg)] px-1.5 py-0.5 font-mono text-xs text-[var(--admin-text)]",
  footnote: "text-xs text-[var(--admin-text-secondary)]",
  /** Chat moderation thread */
  threadShell:
    "flex flex-col gap-3 rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-page-bg)] p-4",
  messageCard:
    "rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-card-bg)] px-3 py-2 text-sm shadow-sm",
} as const;
