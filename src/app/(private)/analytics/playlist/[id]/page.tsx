import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { PlaylistAnalyticsClient } from "@/components/PlaylistAnalyticsClient";

export default async function PlaylistAnalyticsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/");
  }

  const { id } = await params;

  // Verify ownership and get playlist
  const { data: playlist, error: playlistError } = await supabase
    .from("playlists")
    .select("*, playlist_tracks(track_id, track_order, tracks(id, title, artist, cover_url))")
    .eq("id", id)
    .eq("user_email", session.user.email)
    .single();

  if (playlistError || !playlist) {
    redirect("/analytics");
  }

  // Get sessions
  const { data: sessions } = await supabase
    .from("playback_sessions")
    .select("*, tracking_links(reference_name, custom_slug)")
    .eq("playlist_id", id)
    .order("started_at", { ascending: false });

  // Get explicitly defined tracking links for this playlist
  const { data: trackingLinks } = await supabase
    .from("tracking_links")
    .select("*")
    .eq("playlist_id", id)
    .order("created_at", { ascending: false });

  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 md:ml-64 pb-32 pt-20 md:pt-0 md:pb-0">
      <PlaylistAnalyticsClient playlist={playlist} sessions={sessions || []} trackingLinks={trackingLinks || []} />
    </main>
  );
}
