import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

// Helper to extract YouTube Video ID from various URL formats
function extractYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { youtubeUrl } = await req.json();
    if (!youtubeUrl) {
      return NextResponse.json({ error: 'Missing YouTube URL' }, { status: 400 });
    }

    const youtubeId = extractYouTubeId(youtubeUrl);
    if (!youtubeId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Attempt to fetch title from YouTube oEmbed API for convenience
    let title = 'YouTube Video';
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        title = oembedData.title || title;
      }
    } catch (e) {
      // fallback to default if oEmbed fails
    }

    const coverUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
    const slug = crypto.randomUUID().substring(0, 8);

    // Save to Supabase (Requires youtube_id column to exist in tracks table)
    const { data, error } = await supabaseAdmin.from('tracks').insert({
      title,
      youtube_id: youtubeId, // NEW COLUMN
      google_drive_file_id: 'youtube_video', // Dummy value to bypass NOT NULL constraint
      cover_url: coverUrl,
      slug,
      allow_downloads: false,
      user_email: session.user.email
    }).select().single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to save YouTube track: ' + error.message);
    }

    return NextResponse.json({ success: true, track: data });
  } catch (error: any) {
    console.error('YouTube Track Creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
