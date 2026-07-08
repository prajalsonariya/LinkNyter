import { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase-admin'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://linknyter.com';

  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    }
  ];

  // Fetch all public tracks
  try {
    const { data: tracks } = await supabaseAdmin
      .from('tracks')
      .select('slug, id, updated_at');
      
    if (tracks) {
      tracks.forEach((track) => {
        routes.push({
          url: `${baseUrl}/t/${track.slug || track.id}`,
          lastModified: new Date(track.updated_at || new Date()),
          changeFrequency: 'monthly',
          priority: 0.8,
        });
      });
    }

    // Fetch all public playlists
    const { data: playlists } = await supabaseAdmin
      .from('playlists')
      .select('custom_slug, id, updated_at');
      
    if (playlists) {
      playlists.forEach((playlist) => {
        routes.push({
          url: `${baseUrl}/p/${playlist.custom_slug || playlist.id}`,
          lastModified: new Date(playlist.updated_at || new Date()),
          changeFrequency: 'weekly',
          priority: 0.9,
        });
      });
    }
  } catch (error) {
    console.error("Failed to generate dynamic sitemap routes", error);
  }

  return routes;
}
