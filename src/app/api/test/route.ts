import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase.from('profiles').select('*');
  return NextResponse.json({ data, error });
}

export async function POST() {
  const { data, error } = await supabase.from('profiles').insert({
    email: 'test@example.com',
    name: 'Test',
    role: 'admin',
    plan: 'pro'
  }).select();
  return NextResponse.json({ data, error });
}
