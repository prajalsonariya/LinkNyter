-- Create tracking_links table
CREATE TABLE IF NOT EXISTS tracking_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    reference_name TEXT NOT NULL,
    custom_slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create playback_sessions table
CREATE TABLE IF NOT EXISTS playback_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_link_id UUID REFERENCES tracking_links(id) ON DELETE SET NULL,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    total_listen_time_seconds INTEGER DEFAULT 0,
    completion_percentage FLOAT DEFAULT 0,
    event_log JSONB DEFAULT '[]'::jsonb,
    download_clicked BOOLEAN DEFAULT FALSE,
    social_links_clicked BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE tracking_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE playback_sessions ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
-- Since the app uses NextAuth instead of Supabase Auth, the Next.js API routes act as the secure server layer. 
-- We allow public/anon access on the database level, and rely on the Next.js API routes to enforce session security.

CREATE POLICY "Allow public all on tracking_links" 
ON tracking_links FOR ALL 
TO public 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public all on playback_sessions" 
ON playback_sessions FOR ALL 
TO public 
USING (true)
WITH CHECK (true);
