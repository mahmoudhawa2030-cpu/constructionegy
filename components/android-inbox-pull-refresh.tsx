"use client";

import type { ReactNode } from "react";

import { PullToRefreshScroll } from "@/components/pull-to-refresh-scroll";

type Props = {
  children: ReactNode;
};

/** Pull-down to refresh for the messages inbox on Capacitor Android only. */
export function AndroidInboxPullRefresh({ children }: Props) {
  return (
    <PullToRefreshScroll namespace="messagesInbox" platformScope="androidNative">
      {children}
    </PullToRefreshScroll>
  );
}
