import Image from "next/image";

type Props = {
  label: string;
  /** Extra classes on the wrapper (e.g. alignment). */
  className?: string;
  /**
   * Visible size in CSS pixels (width = height). Default matches old inline icon (~18px).
   */
  sizePx?: number;
};

const BADGE_SRC = "/icons/verified-business-badge.png";

/** Raster badge scales cleanly when intrinsic resolution is ≥2× the display size. */
const INTRINSIC = 128;

/**
 * Verified business mark (custom asset in `public/icons/verified-business-badge.png`).
 */
export function VerifiedBadge({ label, className = "", sizePx = 18 }: Props) {
  const px = Math.max(12, Math.min(40, sizePx));

  return (
    <span
      aria-label={label}
      className={`inline-flex shrink-0 items-center justify-center leading-none ${className}`}
      title={label}
      style={{ width: px, height: px }}
    >
      <Image
        alt=""
        className="block h-full w-full object-contain"
        height={INTRINSIC}
        src={BADGE_SRC}
        unoptimized
        width={INTRINSIC}
      />
    </span>
  );
}
