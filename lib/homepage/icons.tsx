import type { LucideIcon } from "lucide-react";
import {
  Blocks,
  Building2,
  ClipboardList,
  Factory,
  Fence,
  Hammer,
  HardHat,
  LayoutGrid,
  Layers,
  MapPin,
  Package,
  Ruler,
  ShoppingCart,
  Truck,
  Wrench,
} from "lucide-react";

export const HOMEPAGE_ICON_KEYS = [
  "building",
  "blocks",
  "package",
  "truck",
  "wrench",
  "layers",
  "grid",
  "clipboard",
  "map_pin",
  "hard_hat",
  "ruler",
  "factory",
  "shopping",
  "fence",
  "hammer",
] as const;

export type HomepageIconKey = (typeof HOMEPAGE_ICON_KEYS)[number];

const ICON_MAP: Record<HomepageIconKey, LucideIcon> = {
  building: Building2,
  blocks: Blocks,
  package: Package,
  truck: Truck,
  wrench: Wrench,
  layers: Layers,
  grid: LayoutGrid,
  clipboard: ClipboardList,
  map_pin: MapPin,
  hard_hat: HardHat,
  ruler: Ruler,
  factory: Factory,
  shopping: ShoppingCart,
  fence: Fence,
  hammer: Hammer,
};

export function isHomepageIconKey(s: string): s is HomepageIconKey {
  return (HOMEPAGE_ICON_KEYS as readonly string[]).includes(s);
}

type IconSlotProps = {
  iconKey: string | null | undefined;
  iconEmoji: string | null | undefined;
  /** Lucide stroke icon */
  className?: string;
  /** Wrapper for emoji fallback */
  emojiClassName?: string;
};

export function HomepageItemIcon({ iconKey, iconEmoji, className, emojiClassName }: IconSlotProps) {
  const key = iconKey?.trim();
  if (key && isHomepageIconKey(key)) {
    const Icon = ICON_MAP[key];
    return <Icon aria-hidden className={className ?? "h-7 w-7 text-zinc-700 dark:text-zinc-200"} />;
  }
  const em = iconEmoji?.trim();
  if (em) {
    return (
      <span aria-hidden className={emojiClassName ?? "text-2xl leading-none"}>
        {em}
      </span>
    );
  }
  return (
    <span aria-hidden className={emojiClassName ?? "text-2xl leading-none text-zinc-400"}>
      ·
    </span>
  );
}
