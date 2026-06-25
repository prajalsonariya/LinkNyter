import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request, props: { params: Promise<{ trackId: string }> }) {
  const params = await props.params;
  const trackId = params.trackId;

  const { data: track, error } = await supabase
    .from('tracks')
    .select('google_drive_file_id, title')
    .eq('id', trackId)
    .single();

  if (error || !track) {
    return NextResponse.json({ error: 'Track not found' }, { status: 404 });
  }

  const rangeHeader = req.headers.get('range');
  
  try {
    const driveUrl = `https://drive.google.com/uc?export=view&id=${track.google_drive_file_id}`;
    const fetchRes = await fetch(driveUrl, {
      headers: {
        ...(rangeHeader ? { Range: rangeHeader } : {})
      }
    });

    // Google Drive returns 404 for missing files or private files
    if (fetchRes.status === 404) {
      // Lazy cleanup: If the file is missing from Drive, delete the track from the database
      console.warn(`Audio file missing for track ${trackId}, deleting track from database...`);
      await supabase.from('tracks').delete().eq('id', trackId);
      return NextResponse.json({ error: 'Audio file is missing from Google Drive, track deleted.' }, { status: 404 });
    }

    if (!fetchRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch from Google Drive' }, { status: fetchRes.status });
    }

    const headers = new Headers();
    fetchRes.headers.forEach((value, key) => {
      // Prevent gzipped proxying which breaks range requests in audio tags
      if (key.toLowerCase() !== 'content-encoding') {
        headers.set(key, value);
      }
    });

    // Force strict MIME types if Drive defaulted to generic octet-stream
    const contentType = headers.get('content-type') || '';
    if (!contentType || contentType.includes('octet-stream')) {
      const title = track.title?.toLowerCase() || '';
      if (title.endsWith('.wav')) headers.set('content-type', 'audio/wav');
      else if (title.endsWith('.aiff') || title.endsWith('.aif')) headers.set('content-type', 'audio/x-aiff');
      else headers.set('content-type', 'audio/mpeg'); // Default MP3
    }

    // Pass the Web Stream directly to Next.js
    return new NextResponse(fetchRes.body, {
      status: fetchRes.status,
      statusText: fetchRes.statusText,
      headers,
    });
  } catch (error: any) {
    console.error('Stream error:', error);
    return NextResponse.json({ error: 'Stream failed' }, { status: 500 });
  }
}
