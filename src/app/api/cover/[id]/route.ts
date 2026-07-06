import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const fileId = resolvedParams.id;

    if (!fileId) {
      return new NextResponse('File ID is required', { status: 400 });
    }

    // Since the file was made public during upload, we can fetch it directly without auth
    const driveUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    const fetchRes = await fetch(driveUrl);

    // Google Drive returns 404 for missing files or private files
    if (fetchRes.status === 404) {
      // Lazy cleanup: If the cover art is missing from Drive, clear it from the database
      console.warn(`Cover image missing from Drive: ${fileId}. Resetting in database...`);
      await supabaseAdmin.from('tracks').update({ cover_url: '' }).eq('cover_url', `/api/cover/${fileId}`);
      return new NextResponse('Image not found or inaccessible', { status: 404 });
    }

    if (!fetchRes.ok) {
      return new NextResponse('Image not found or inaccessible', { status: fetchRes.status });
    }

    const headers = new Headers();
    const contentType = fetchRes.headers.get('content-type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    } else {
      headers.set('Content-Type', 'image/jpeg');
    }
    
    // Cache the image heavily since cover arts rarely change for the same ID
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new NextResponse(fetchRes.body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Cover image proxy error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
