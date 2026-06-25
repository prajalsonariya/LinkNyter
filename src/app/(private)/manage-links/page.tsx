"use client";

import { ManageLinksView } from "@/components/ManageLinksView";
import { useDashboard } from "@/contexts/DashboardContext";

export default function ManageLinksPage() {
  const { tracks } = useDashboard();
  
  return (
    <main className="flex-1 ml-64 overflow-y-auto custom-scrollbar relative z-10">
      <ManageLinksView tracks={tracks} />
    </main>
  );
}
