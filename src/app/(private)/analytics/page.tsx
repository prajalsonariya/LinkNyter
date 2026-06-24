"use client";

import { AnalyticsView } from "@/components/AnalyticsView";
import { useDashboard } from "@/contexts/DashboardContext";

export default function AnalyticsPage() {
  const { tracks } = useDashboard();
  
  return (
    <main className="flex-1 ml-64 overflow-y-auto custom-scrollbar relative z-10">
      <AnalyticsView tracks={tracks} />
    </main>
  );
}
