"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type MobileChromeMenuContextValue = {
  open: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
};

const MobileChromeMenuContext = createContext<MobileChromeMenuContextValue | null>(null);

export function MobileChromeMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openMenu = useCallback(() => setOpen(true), []);
  const closeMenu = useCallback(() => setOpen(false), []);
  const toggleMenu = useCallback(() => setOpen((v) => !v), []);

  return (
    <MobileChromeMenuContext.Provider value={{ open, openMenu, closeMenu, toggleMenu }}>
      {children}
    </MobileChromeMenuContext.Provider>
  );
}

export function useMobileChromeMenu() {
  const ctx = useContext(MobileChromeMenuContext);
  if (!ctx) {
    throw new Error("useMobileChromeMenu must be used within MobileChromeMenuProvider");
  }
  return ctx;
}
