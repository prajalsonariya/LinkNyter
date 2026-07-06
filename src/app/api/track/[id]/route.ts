import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { google } from 'googleapis';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const trackId = resolvedParams.id;

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership and get current cover_url for cleanup
    const { data: track, error: fetchError } = await supabaseAdmin
      .from('tracks')
      .select('user_email, cover_url')
      .eq('id', trackId)
      .single();

    if (fetchError || !track) {
      console.error('Track fetch error for id', trackId, ':', fetchError);
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    if (track.user_email !== session.user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates = await req.json();

    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.artist !== undefined) updateData.artist = updates.artist;
    if (updates.allow_downloads !== undefined) updateData.allow_downloads = updates.allow_downloads;
    if (updates.lrc_data !== undefined) updateData.lrc_data = updates.lrc_data;
    if (updates.lrc_timing !== undefined) updateData.lrc_timing = updates.lrc_timing;
    
    if (updates.cover_url !== undefined && updates.cover_url !== track.cover_url) {
      updateData.cover_url = updates.cover_url;
      
      // Delete old cover art from Drive if it exists
      if (track.cover_url) {
        let coverId = null;
        if (track.cover_url.includes('drive.google.com/uc?export=view&id=')) {
          coverId = new URL(track.cover_url).searchParams.get('id');
        } else if (track.cover_url.startsWith('/api/cover/')) {
          coverId = track.cover_url.split('/api/cover/')[1];
        }
        
        if (coverId) {
          try {
            const oauth2Client = new google.auth.OAuth2();
            oauth2Client.setCredentials({ access_token: session.accessToken as string });
            const drive = google.drive({ version: 'v3', auth: oauth2Client });
            
            await drive.files.delete({ fileId: coverId });
          } catch (e: any) {
            console.error('Failed to delete old cover file from Drive:', e.message);
          }
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from('tracks')
      .update(updateData)
      .eq('id', trackId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, track: data });
  } catch (error: any) {
    console.error('Update track error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const trackId = resolvedParams.id;

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership and get google drive file IDs
    const { data: track, error: fetchError } = await supabaseAdmin
      .from('tracks')
      .select('user_email, google_drive_file_id, cover_url')
      .eq('id', trackId)
      .single();

    if (fetchError || !track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    if (track.user_email !== session.user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Initialize Google Drive client
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken as string });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // 1. Delete Audio File from Google Drive
    if (track.google_drive_file_id) {
      try {
        await drive.files.delete({ fileId: track.google_drive_file_id });
      } catch (e: any) {
        console.error('Failed to delete audio file from Drive:', e.message);
        // Continue even if Drive deletion fails (e.g., file already manually deleted)
      }
    }

    // 2. Delete Cover Art File from Google Drive
    if (track.cover_url) {
      let coverId = null;
      if (track.cover_url.includes('drive.google.com/uc?export=view&id=')) {
        coverId = new URL(track.cover_url).searchParams.get('id');
      } else if (track.cover_url.startsWith('/api/cover/')) {
        coverId = track.cover_url.split('/api/cover/')[1];
      }
      
      if (coverId) {
        try {
          await drive.files.delete({ fileId: coverId });
        } catch (e: any) {
          console.error('Failed to delete cover file from Drive:', e.message);
        }
      }
    }

    // 3. Delete from Supabase
    const { error: deleteError } = await supabaseAdmin
      .from('tracks')
      .delete()
      .eq('id', trackId);

    if (deleteError) throw new Error(deleteError.message);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete track error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
