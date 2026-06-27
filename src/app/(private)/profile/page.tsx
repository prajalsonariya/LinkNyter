"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { UserCheck, Share2, AlertTriangle, AlertCircle, Trash2 } from "lucide-react";
import { InstagramIcon, TwitterIcon, YouTubeIcon, SpotifyIcon, AppleMusicIcon, GlobeIcon } from "@/components/SocialIcons";
import { signOut } from "next-auth/react";

export default function ProfilePage() {
  const [artistName, setArtistName] = useState("");
  const [artistBio, setArtistBio] = useState("");
  const [socialLinks, setSocialLinks] = useState({ instagram: "", twitter: "", youtube: "", spotify: "", apple_music: "", website: "" });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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

  const handleAccountDeletion = async () => {
    if (deleteConfirmationText !== "Delete my LinkNyter account") return;
    
    setIsDeletingAccount(true);
    try {
      const res = await fetch('/api/profile/delete', {
        method: 'DELETE'
      });
      
      if (res.ok) {
        toast.success("Account deleted successfully");
        signOut({ callbackUrl: '/' });
      } else {
        const data = await res.json();
        toast.error("Failed to delete account: " + data.error);
        setIsDeletingAccount(false);
      }
    } catch (e: any) {
      toast.error("Error deleting account: " + e.message);
      setIsDeletingAccount(false);
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

        {/* Danger Zone */}
        <section className="space-y-6 pt-12 border-t border-error/20">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-7 h-7 text-error" />
            <h3 className="font-headline-md text-headline-md font-semibold text-error">Danger Zone</h3>
          </div>
          
          <div className="bg-error/5 border border-error/20 rounded-2xl p-8 space-y-6">
            <div>
              <h4 className="font-bold text-on-surface mb-2">Delete Account</h4>
              <p className="text-body-sm text-on-surface-variant max-w-2xl">
                Permanently delete your account, including all your tracks, custom links, lyrics, and analytics. This action cannot be undone.
              </p>
            </div>
            
            <button 
              onClick={() => {
                setDeleteConfirmationText("");
                setShowDeleteModal(true);
              }}
              className="px-6 py-2.5 border border-error/50 text-error hover:bg-error hover:text-on-error rounded-xl font-label-caps text-label-caps transition-colors shadow-lg shadow-error/10"
            >
              Delete My Account
            </button>
          </div>
        </section>

        {/* Spacer */}
        <div className="h-16" />
      </div>

      {/* Account Deletion Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-high border border-outline-variant/30 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-slide-up-fade">
            <h3 className="text-[24px] font-headline-md font-bold text-error mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Delete Account
            </h3>
            
            <p className="text-[14px] text-on-surface-variant mb-4 leading-relaxed">
              You are about to <span className="font-bold text-on-surface">permanently delete</span> your account. All your music, custom URLs, syncing data, and analytics will be wiped immediately.
            </p>
            
            <p className="text-[14px] text-on-surface-variant mb-6">
              To confirm, please type <strong className="text-on-surface select-none">Delete my LinkNyter account</strong> below:
            </p>
            
            <input 
              type="text" 
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="Delete my LinkNyter account"
              className="w-full bg-surface-container border border-error/50 focus:border-error rounded-lg px-4 py-3 text-on-surface focus:outline-none transition-colors mb-8"
              autoFocus
            />
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingAccount}
                className="px-5 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-variant/50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleAccountDeletion}
                disabled={isDeletingAccount || deleteConfirmationText !== "Delete my LinkNyter account"}
                className="px-5 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-widest bg-error hover:bg-error/90 text-on-error shadow-lg shadow-error/20 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isDeletingAccount ? (
                  "Deleting..."
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
