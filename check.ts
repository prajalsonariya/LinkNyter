import { supabaseAdmin } from './src/lib/supabase-admin';
supabaseAdmin.from('playlists').select('*, playlist_tracks(*)').then(res => console.log(JSON.stringify(res.data, null, 2)));
