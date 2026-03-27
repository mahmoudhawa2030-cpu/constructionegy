"use client";

import dynamic from "next/dynamic";

import { MapLoadingFallback } from "@/components/map-loading-fallback";

const LiveMapClient = dynamic(
  () => import("@/components/live-map-client").then((m) => ({ default: m.LiveMapClient })),
  {
    ssr: false,
    loading: () => <MapLoadingFallback />,
  },
);

type Props = {
  userId: string;
};

export function MapPageShell({ userId }: Props) {
  return <LiveMapClient userId={userId} />;
}
