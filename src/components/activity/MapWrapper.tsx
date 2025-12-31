"use client";

import dynamic from "next/dynamic";

const DynamicMap = dynamic(() => import("./ActivityMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-zinc-900 animate-pulse" />
}) as any;

export default function MapWrapper({ latlng, summaryPolyline }: { latlng?: [number, number][], summaryPolyline?: string | null }) {
  return <DynamicMap latlng={latlng} summaryPolyline={summaryPolyline} />;
}
