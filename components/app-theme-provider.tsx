"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function AppThemeProvider({ children }: Props) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
