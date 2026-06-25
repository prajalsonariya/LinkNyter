import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { TrackAnalyticsClient } from "@/components/TrackAnalyticsClient";

export default async function TrackAnalyticsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/");
  }

  const { id } = await params;

  // Verify ownership and get track
  const { data: track, error: trackError } = await supabase
    .from("tracks")
    .select("*")
    .eq("id", id)
    .eq("user_email", session.user.email)
    .single();

  if (trackError || !track) {
    redirect("/analytics");
  }

  // Get sessions
  const { data: sessions } = await supabase
    .from("playback_sessions")
    .select("*, tracking_links(reference_name, custom_slug)")
    .eq("track_id", id)
    .order("started_at", { ascending: false });

  return (
    <main className="flex-1 ml-64 overflow-y-auto custom-scrollbar relative z-10">
      <TrackAnalyticsClient track={track} sessions={sessions || []} />
    </main>
  );
}
