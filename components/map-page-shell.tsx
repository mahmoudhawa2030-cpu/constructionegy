"use client";

import dynamic from "next/dynamic";

import { MapLoadingFallback } from "@/components/map-loading-fallback";
import type { CategoryOption } from "@/lib/categories/queries";

const LiveMapClient = dynamic(
  () => import("@/components/live-map-client").then((m) => ({ default: m.LiveMapClient })),
  {
    ssr: false,
    loading: () => <MapLoadingFallback />,
  },
);

type Props = {
  userId: string;
  categories: CategoryOption[];
  canUseLiveMap: boolean;
};

export function MapPageShell({ userId, categories, canUseLiveMap }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <LiveMapClient canUseLiveMap={canUseLiveMap} categories={categories} userId={userId} />
    </div>
  );
}
