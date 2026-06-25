-- Add Audience Demographics and Device columns to playback_sessions
ALTER TABLE playback_sessions
ADD COLUMN IF NOT EXISTS device_type text,
ADD COLUMN IF NOT EXISTS os text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS city text;
