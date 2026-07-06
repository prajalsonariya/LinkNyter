"use client";

import { Suspense } from "react";
import { AnalyticsView } from "@/components/AnalyticsView";
import { useDashboard } from "@/contexts/DashboardContext";

export default function AnalyticsPage() {
  const { tracks, playlists } = useDashboard();
  
  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 md:ml-64 pb-32 pt-20 md:pt-0 md:pb-0">
      <Suspense fallback={<div className="p-4 md:p-12">Loading analytics...</div>}>
        <AnalyticsView tracks={tracks} playlists={playlists} />
      </Suspense>
    </main>
  );
}
