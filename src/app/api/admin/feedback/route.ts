import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase';

// Helper to check admin role
async function checkAdmin(email: string) {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('email', email)
    .single();
  return data?.role === 'admin';
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await checkAdmin(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ feedback: data });
  } catch (error: any) {
    console.error('Fetch feedback error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
