type Props = {
  ariaLabel: string;
  text: string;
  /** Extra classes on the wrapper. */
  className?: string;
};

/** Compact expert (verified industry expert) mark for feed and profiles. */
export function ExpertBadge({ ariaLabel, text, className = "" }: Props) {
  return (
    <span
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-0.5 rounded border border-[#604010] bg-[#3d2a00] px-1.5 py-0.5 font-bina-display text-[10px] font-bold leading-none text-[var(--bina-gold,#d4a017)] ${className}`}
      title={ariaLabel}
    >
      <span aria-hidden>★</span>
      {text}
    </span>
  );
}
