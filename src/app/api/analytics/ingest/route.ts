import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { UAParser } from 'ua-parser-js';

export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (!text) return NextResponse.json({ success: true });

    const payload = JSON.parse(text);
    const { session_id, track_id, playlist_id, tracking_ref, events, downloads, social_clicks } = payload;

    if (!track_id || !session_id) {
      return NextResponse.json({ error: 'Missing track_id or session_id' }, { status: 400 });
    }

    // 1. Resolve tracking_link_id if tracking_ref is provided
    let tracking_link_id = null;
    if (tracking_ref) {
      const { data: linkData } = await supabase
        .from('tracking_links')
        .select('id')
        .eq('custom_slug', tracking_ref)
        .single();
      
      if (linkData) {
        tracking_link_id = linkData.id;
      }
    }

    // 2. Calculate total_listen_time_seconds based on wall clock time between play and pause/seeked
    let totalListenTimeSeconds = 0;
    let lastPlayWallTime: Date | null = null;
    let maxAudioTimestamp = 0;

    for (const ev of events) {
      if (ev.timestamp > maxAudioTimestamp) {
        maxAudioTimestamp = ev.timestamp;
      }

      if (ev.action === 'play') {
        lastPlayWallTime = new Date(ev.time);
      } else if ((ev.action === 'pause' || ev.action === 'seeked') && lastPlayWallTime) {
        const diff = (new Date(ev.time).getTime() - lastPlayWallTime.getTime()) / 1000;
        if (diff > 0 && diff < 86400) { // sanity check, max 24h
          totalListenTimeSeconds += diff;
        }
        lastPlayWallTime = null;
      }
    }

    // If they closed the tab while it was still playing, add the final chunk
    if (lastPlayWallTime) {
      const diff = (new Date().getTime() - lastPlayWallTime.getTime()) / 1000;
      if (diff > 0 && diff < 86400) {
        totalListenTimeSeconds += diff;
      }
    }

    // Since we don't have absolute track duration in the DB, we can't reliably compute a true completion %.
    // We will store 0, and the dashboard can use maxAudioTimestamp or totalListenTime to gauge engagement.
    
    // 3. Extract Audience Demographics
    const uaString = req.headers.get('user-agent') || '';
    const parser = new UAParser(uaString);
    const result = parser.getResult();
    
    let device_type = result.device.type || 'Desktop';
    if (device_type === 'mobile') device_type = 'Mobile';
    if (device_type === 'tablet') device_type = 'Tablet';
    if (device_type !== 'Mobile' && device_type !== 'Tablet') device_type = 'Desktop';

    const osName = result.os.name || 'Unknown';
    const browserName = result.browser.name || 'Unknown';
    // We store browser inside the OS column delimited by '|' to avoid DB schema migrations
    const os = `${osName} | ${browserName}`;

    let country = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry');
    let rawCity = req.headers.get('x-vercel-ip-city');

    if (!country || country === 'Unknown') {
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('remote-addr') || '';
      const realIp = ip.split(',')[0].trim();
      
      let fetchUrl = `http://ip-api.com/json/${realIp}?fields=countryCode,city`;
      if (!realIp || realIp === '::1' || realIp.includes('127.0.0.1') || realIp === 'localhost') {
        fetchUrl = `http://ip-api.com/json/?fields=countryCode,city`;
      }
      
      try {
        const res = await fetch(fetchUrl);
        const data = await res.json();
        if (data.countryCode) country = data.countryCode;
        if (data.city) rawCity = data.city;
      } catch(e) {
        // ignore
      }
    }

    country = country || 'Unknown';
    const city = rawCity ? decodeURIComponent(rawCity) : 'Unknown';

    // 4. Upsert into playback_sessions
    // We use the Supabase Service Role key if RLS blocks anonymous inserts, 
    // but the SQL policy "Allow public telemetry ingest" allows public inserts/updates.
    const { error: insertError } = await supabase
      .from('playback_sessions')
      .upsert({
        id: session_id,
        track_id,
        playlist_id,
        tracking_link_id,
        total_listen_time_seconds: Math.round(totalListenTimeSeconds),
        completion_percentage: maxAudioTimestamp, // Storing max audio time here for now
        event_log: events,
        download_clicked: downloads > 0,
        social_links_clicked: social_clicks > 0,
        device_type,
        os,
        country,
        city
      }, { onConflict: 'id' });

    if (insertError) {
      console.error('Ingest insert error:', insertError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telemetry ingest error:', error);
    // Send 200 anyway so beacon doesn't retry unnecessarily
    return NextResponse.json({ success: true });
  }
}
