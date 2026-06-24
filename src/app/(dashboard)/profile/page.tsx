"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { UserCheck, Share2 } from "lucide-react";
import { InstagramIcon, TwitterIcon, YouTubeIcon, SpotifyIcon, AppleMusicIcon, GlobeIcon } from "@/components/SocialIcons";

export default function ProfilePage() {
  const [artistName, setArtistName] = useState("");
  const [artistBio, setArtistBio] = useState("");
  const [socialLinks, setSocialLinks] = useState({ instagram: "", twitter: "", youtube: "", spotify: "", apple_music: "", website: "" });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data.profile) {
          setArtistName(data.profile.name || "");
          setArtistBio(data.profile.bio || "");
          setSocialLinks(data.profile.social_links || { instagram: "", twitter: "", youtube: "", spotify: "", apple_music: "", website: "" });
        }
      })
      .catch(err => console.error("Failed to load profile:", err));
  }, []);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: artistName, bio: artistBio, social_links: socialLinks })
      });
      if (res.ok) {
        toast.success("Profile saved successfully!");
      } else {
        const data = await res.json();
        toast.error("Failed to save profile: " + data.error);
      }
    } catch (e: any) {
      toast.error("Error saving profile: " + e.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <main className="flex-1 ml-64 overflow-y-auto custom-scrollbar relative z-10">
      <header className="sticky top-0 w-full z-40 flex justify-between items-center px-margin-desktop h-20 bg-surface/60 backdrop-blur-xl">
        <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Artist Profile</h2>
      </header>

      <div className="p-margin-desktop max-w-3xl mx-auto space-y-10 animate-fade-in">
        {/* Artist Identity */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <UserCheck className="w-7 h-7 text-primary" />
            <h3 className="font-headline-md text-headline-md font-semibold text-on-surface">Artist Identity</h3>
          </div>
          
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 space-y-6">
            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Artist Name</label>
              <input 
                type="text" 
                value={artistName} 
                onChange={(e) => setArtistName(e.target.value)}
                placeholder="e.g. The Weeknd, Daft Punk, Billie Eilish"
                className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-body-sm text-on-surface-variant">This is the name displayed on all your public track pages.</p>
            </div>
            
            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Bio</label>
              <textarea 
                value={artistBio} 
                onChange={(e) => setArtistBio(e.target.value)}
                placeholder="Tell listeners about yourself, your music, your story..."
                rows={4}
                className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>
          </div>
        </section>

        {/* Social Links */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Share2 className="w-7 h-7 text-primary" />
            <h3 className="font-headline-md text-headline-md font-semibold text-on-surface">Social Links</h3>
          </div>
          <p className="text-body-sm text-on-surface-variant -mt-4">These will appear on your public track pages so listeners can find you elsewhere.</p>
          
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 space-y-5">
            {[
              { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle', icon: <InstagramIcon className="w-5 h-5" /> },
              { key: 'twitter', label: 'X (Twitter)', placeholder: 'https://x.com/yourhandle', icon: <TwitterIcon className="w-5 h-5" /> },
              { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourchannel', icon: <YouTubeIcon className="w-5 h-5" /> },
              { key: 'spotify', label: 'Spotify', placeholder: 'https://open.spotify.com/artist/...', icon: <SpotifyIcon className="w-5 h-5" /> },
              { key: 'apple_music', label: 'Apple Music', placeholder: 'https://music.apple.com/artist/...', icon: <AppleMusicIcon className="w-5 h-5" /> },
              { key: 'website', label: 'Website', placeholder: 'https://yourwebsite.com', icon: <GlobeIcon className="w-5 h-5" /> },
            ].map(({ key, label, placeholder, icon }) => (
              <div key={key} className="space-y-2">
                <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">{label}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    {icon}
                  </span>
                  <input 
                    type="url" 
                    value={(socialLinks as any)[key] || ''}
                    onChange={(e) => setSocialLinks({ ...socialLinks, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full bg-surface-container border border-outline-variant rounded-lg pl-12 pr-4 py-2.5 text-on-surface text-body-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <button 
            onClick={handleSaveProfile} 
            disabled={isSavingProfile}
            className="px-8 py-3 bg-primary text-on-primary rounded-full font-label-caps text-label-caps hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {isSavingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {/* Spacer */}
        <div className="h-16" />
      </div>
    </main>
  );
}
