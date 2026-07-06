import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const trackId = params.id;
  const userAgent = req.headers.get('user-agent') || 'unknown';

  try {
    // 1. Query the track to check allow_downloads
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('google_drive_file_id, title, allow_downloads, user_email, artist')
      .eq('id', trackId)
      .single();

    if (trackError || !track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    if (!track.allow_downloads) {
      return NextResponse.json({ error: 'Downloads are disabled for this track' }, { status: 403 });
    }

    // 2. Proxy the Google Drive stream
    const driveUrl = `https://drive.google.com/uc?export=view&id=${track.google_drive_file_id}`;
    const fetchRes = await fetch(driveUrl);

    if (fetchRes.status === 404) {
      return NextResponse.json({ error: 'Audio file is missing from Google Drive' }, { status: 404 });
    }

    if (!fetchRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch from Google Drive' }, { status: fetchRes.status });
    }

    // 3. Log Analytics (fire and forget)
    supabase.from('analytics').insert({
      track_id: trackId,
      event_type: 'download',
      user_agent: userAgent
    }).then(({ error }) => {
      if (error) console.error('Failed to log download:', error);
    });

    // 4. Return as Attachment
    const headers = new Headers();
    fetchRes.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding') {
        headers.set(key, value);
      }
    });

    // Determine extension based on content-type or fallback to mp3
    const contentType = headers.get('content-type') || '';
    let ext = 'mp3';
    if (contentType.includes('wav')) ext = 'wav';
    else if (contentType.includes('ogg')) ext = 'ogg';
    else if (contentType.includes('flac')) ext = 'flac';
    else if (contentType.includes('aac')) ext = 'aac';
    else if (contentType.includes('mp4')) ext = 'm4a';

    const artistName = track.artist || track.user_email?.split('@')[0] || "Unknown Artist";
    // Sanitize filename
    const safeTitle = (track.title || 'audio').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const safeArtist = artistName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    headers.set('content-disposition', `attachment; filename="${safeArtist}_${safeTitle}.${ext}"`);

    return new NextResponse(fetchRes.body, {
      status: fetchRes.status,
      statusText: fetchRes.statusText,
      headers,
    });
  } catch (error: any) {
    console.error('Download route error:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
