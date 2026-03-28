"use client";

import { useEffect, useState } from "react";

/** Matches Tailwind `md` (768px): hide mobile-only nav patterns at `md` and up. */
const MOBILE_NAV_MAX_WIDTH = "(max-width: 767px)";

export function useIsMobileNav() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_NAV_MAX_WIDTH);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
