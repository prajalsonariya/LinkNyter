import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(10);
  const { data: tracks, error: tError } = await supabase.from('tracks').select('*').limit(10);
  const { data: sessions, error: sError } = await supabase.from('playback_sessions').select('*').limit(10);

  return NextResponse.json({ profiles, pError, tracks, tError, sessions, sError });
}
