import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

async function checkAdmin(email: string) {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('email', email)
    .single();
  return data?.role === 'admin';
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await checkAdmin(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates = await req.json();
    const { data, error } = await supabaseAdmin
      .from('feedback')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ feedback: data });
  } catch (error: any) {
    console.error('Update feedback error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await checkAdmin(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('feedback')
      .delete()
      .eq('id', params.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete feedback error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
