import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { UAParser } from 'ua-parser-js';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract Demographics
    const uaString = req.headers.get('user-agent') || '';
    const parser = new UAParser(uaString);
    const result = parser.getResult();
    
    let device_type = result.device.type || 'Desktop';
    if (device_type === 'mobile') device_type = 'Mobile';
    if (device_type === 'tablet') device_type = 'Tablet';
    if (device_type !== 'Mobile' && device_type !== 'Tablet') device_type = 'Desktop';

    const osName = result.os.name || 'Unknown';
    const browserName = result.browser.name || 'Unknown';
    const os = `${osName} | ${browserName}`;

    let country = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry');

    if (!country || country === 'Unknown') {
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('remote-addr') || '';
      const realIp = ip.split(',')[0].trim();
      
      let fetchUrl = `http://ip-api.com/json/${realIp}?fields=countryCode`;
      if (!realIp || realIp === '::1' || realIp.includes('127.0.0.1') || realIp === 'localhost') {
        fetchUrl = `http://ip-api.com/json/?fields=countryCode`;
      }
      
      try {
        const res = await fetch(fetchUrl);
        const data = await res.json();
        if (data.countryCode) country = data.countryCode;
      } catch(e) {
        // ignore
      }
    }

    country = country || 'Unknown';

    // Insert into DB using Admin Client to bypass RLS
    const { error } = await supabaseAdmin
      .from('musician_sessions')
      .insert({
        user_email: session.user.email,
        device_type,
        os,
        country
      });

    if (error) {
      console.error('Failed to log musician session:', error);
      // Don't throw 500, just fail silently so it doesn't break dashboard
      return NextResponse.json({ success: false, error: error.message });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Musician ingest error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
