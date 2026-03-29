type Props = {
  label: string;
  className?: string;
};

/** Visual trust badge (verified business). */
export function VerifiedBadge({ label, className = "" }: Props) {
  return (
    <span
      aria-label={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#1d9bf0] p-0.5 text-white shadow-sm ring-1 ring-[#1d9bf0]/30 ${className}`}
      title={label}
    >
      <svg aria-hidden className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" fill="currentColor" r="11" />
        <path
          d="M8.2 12.5 10.8 15.2 16 9.9"
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
        />
      </svg>
    </span>
  );
}
