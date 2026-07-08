import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description } = await req.json();

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('feedback')
      .insert([
        { 
          user_email: session.user.email,
          title, 
          description 
        }
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, feedback: data });
  } catch (error: any) {
    console.error('Submit feedback error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
