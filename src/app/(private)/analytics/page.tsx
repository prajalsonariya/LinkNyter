"use client";

import { Suspense } from "react";
import { AnalyticsView } from "@/components/AnalyticsView";
import { useDashboard } from "@/contexts/DashboardContext";

export default function AnalyticsPage() {
  const { tracks } = useDashboard();
  
  return (
    <main className="flex-1 ml-64 overflow-y-auto custom-scrollbar relative z-10">
      <Suspense fallback={<div className="p-12">Loading analytics...</div>}>
        <AnalyticsView tracks={tracks} />
      </Suspense>
    </main>
  );
}
