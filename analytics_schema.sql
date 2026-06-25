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

-- For tracking_links: Allow public read by custom_slug
CREATE POLICY "Allow public read on tracking_links" 
ON tracking_links FOR SELECT 
TO public 
USING (true);

-- For tracking_links: Allow authenticated users to insert/read their own tracking links
-- (Assuming tracks table has user_id, we join it to verify ownership)
CREATE POLICY "Allow creator access to tracking_links" 
ON tracking_links FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM tracks 
        WHERE tracks.id = tracking_links.track_id 
        AND tracks.user_id = auth.uid()
    )
);

-- For playback_sessions: Allow public inserts (Telemetry ingest)
CREATE POLICY "Allow public telemetry ingest" 
ON playback_sessions FOR INSERT 
TO public 
WITH CHECK (true);

-- For playback_sessions: Allow authenticated users to read their own sessions
CREATE POLICY "Allow creator to view playback_sessions" 
ON playback_sessions FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM tracks 
        WHERE tracks.id = playback_sessions.track_id 
        AND tracks.user_id = auth.uid()
    )
);
