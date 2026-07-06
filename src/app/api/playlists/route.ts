import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, cover_art_url } = await req.json();
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

    const custom_slug = `pl-${uuidv4().substring(0, 8)}`;

    // Using anon key here will work if RLS allows or if we use service role key in another file.
    // Wait, we need to bypass RLS for inserts if we didn't set a wide open policy.
    // Let's use the standard supabase client. If it fails, we need service role.
    const { data: playlist, error } = await supabaseAdmin
      .from('playlists')
      .insert({
        title,
        cover_art_url,
        custom_slug,
        user_email: session.user.email
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ playlist });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
