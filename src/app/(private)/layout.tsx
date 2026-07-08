"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { LayoutGrid, BarChart2, User, Shield, UploadCloud, LogOut, Link as LinkIcon, ListMusic } from "lucide-react";
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const brandHref = pathname === '/dashboard' ? '/' : '/dashboard';
  const { data: session } = useSession();
  const { 
    dragActive, isUploading, uploadProgress, 
    inputRef, handleGlobalDrag, handleGlobalDrop, handleChange 
  } = useDashboard();

  if (session === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-6 text-center px-4 relative z-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="/logo.svg" alt="LinkNyter Logo" className="h-12 md:h-14 w-auto" />
          <h1 className="font-display-lg text-display-lg font-bold text-primary tracking-tighter">LinkNyter</h1>
        </div>
        <p className="text-on-surface-variant max-w-md text-body-lg">The easiest way to share, stream, and present your music directly from your Google Drive.</p>
        <button 
          onClick={() => signIn('google')}
          className="bg-primary text-on-primary font-label-caps text-label-caps py-4 px-8 rounded-full hover:opacity-90 transition-all"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  return (
    <div 
      onDragEnter={handleGlobalDrag}
      onDragOver={handleGlobalDrag}
      onDragLeave={handleGlobalDrag}
      onDrop={handleGlobalDrop}
      className="flex h-screen overflow-hidden selection:bg-primary-container selection:text-on-primary-container relative"
    >
      {/* Background Atmospheric Effect */}
      <div className="fixed top-0 right-0 -z-10 w-1/3 h-1/3 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-64 -z-10 w-1/4 h-1/4 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

      {dragActive && !isUploading && (
        <div className="fixed inset-0 z-[9999] bg-primary/10 border-4 border-dashed border-primary backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <h2 className="text-primary text-display-lg font-bold">Drop Audio Anywhere!</h2>
        </div>
      )}

      {/* Left Sidebar (Desktop Only) */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 border-r border-outline-variant bg-surface/80 backdrop-blur-xl flex-col py-margin-desktop px-gutter z-50">
        <Link href={brandHref} className="mb-10 flex items-start gap-2 group cursor-pointer">
          <img src="/logo.svg" alt="LinkNyter Logo" className="h-8 md:h-10 w-auto mt-0.5" />
          <div className="flex flex-col">
            <h1 className="font-display-lg text-[32px] font-bold text-primary tracking-tighter leading-none">LinkNyter</h1>
            <p className="font-label-caps text-[10px] md:text-[11px] text-on-surface-variant uppercase tracking-widest mt-1">Creator Studio</p>
          </div>
        </Link>
        
        <nav className="flex-1 space-y-2">
          <Link href="/dashboard" className={`flex items-center gap-3 py-3 px-4 rounded transition-all w-full ${pathname === '/dashboard' ? 'text-primary font-bold border-r-2 border-primary bg-surface-container-high active:scale-95 duration-100' : 'text-on-surface-variant font-body-sm hover:bg-surface-container-high'}`}>
            <LayoutGrid className="w-5 h-5" />
            <span className="font-label-caps text-label-caps">Dashboard</span>
          </Link>
          <Link href="/manage-links" className={`flex items-center gap-3 py-3 px-4 rounded transition-all w-full ${pathname === '/manage-links' ? 'text-primary font-bold border-r-2 border-primary bg-surface-container-high active:scale-95 duration-100' : 'text-on-surface-variant font-body-sm hover:bg-surface-container-high'}`}>
            <LinkIcon className="w-5 h-5" />
            <span className="font-label-caps text-label-caps">Share Links</span>
          </Link>
          <Link href="/analytics" className={`flex items-center gap-3 py-3 px-4 rounded transition-all w-full ${pathname === '/analytics' ? 'text-primary font-bold border-r-2 border-primary bg-surface-container-high active:scale-95 duration-100' : 'text-on-surface-variant font-body-sm hover:bg-surface-container-high'}`}>
            <BarChart2 className="w-5 h-5" />
            <span className="font-label-caps text-label-caps">Analytics</span>
          </Link>
          <Link href="/lrc-sync" className={`flex items-center gap-3 py-3 px-4 rounded transition-all w-full ${pathname === '/lrc-sync' ? 'text-primary font-bold border-r-2 border-primary bg-surface-container-high active:scale-95 duration-100' : 'text-on-surface-variant font-body-sm hover:bg-surface-container-high'}`}>
            <ListMusic className="w-5 h-5" />
            <span className="font-label-caps text-label-caps">Sync Lyrics</span>
          </Link>
          <Link href="/profile" className={`flex items-center gap-3 py-3 px-4 rounded transition-all w-full ${pathname === '/profile' ? 'text-primary font-bold border-r-2 border-primary bg-surface-container-high active:scale-95 duration-100' : 'text-on-surface-variant font-body-sm hover:bg-surface-container-high'}`}>
            <User className="w-5 h-5" />
            <span className="font-label-caps text-label-caps">Profile</span>
          </Link>
          {session?.user?.role === 'admin' && (
            <Link href="/admin" className="flex items-center gap-3 py-3 px-4 rounded text-on-surface-variant font-body-sm hover:bg-surface-container-high transition-colors duration-200">
              <Shield className="w-5 h-5" />
              <span className="font-label-caps text-label-caps">Admin Panel</span>
            </Link>
          )}
        </nav>
        
        <div className="mt-auto pt-8 border-t border-outline-variant space-y-4">
          {/* Upload Progress inside Sidebar if active */}
          {isUploading && (
             <div className="space-y-2 p-4 border border-outline-variant rounded-xl bg-surface-container-lowest">
               <div className="flex justify-between items-end font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant text-[10px]">
                 <span>Uploading...</span>
                 <span className="text-primary">{uploadProgress}%</span>
               </div>
               <div className="h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
                 <div className="h-full bg-primary active-glow transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
               </div>
             </div>
          )}

          <button 
            onClick={() => {
              if(!isUploading) inputRef.current?.click();
            }}
            className="w-full bg-primary text-on-primary font-label-caps text-label-caps py-4 px-6 rounded-full hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <UploadCloud className="w-5 h-5" />
            Upload Track
          </button>
          
          {/* Hidden File Input for Sidebar Button */}
          <input className="hidden" type="file" accept="audio/*" ref={inputRef} onChange={handleChange} />

          <div className="space-y-1">
            <button className="flex items-center gap-3 py-2 px-4 text-on-surface-variant font-body-sm hover:text-error transition-colors cursor-pointer w-full" onClick={() => signOut()}>
              <LogOut className="w-5 h-5" />
              <span className="font-body-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top App Bar */}
      <header className="flex md:hidden fixed top-0 w-full bg-surface/80 backdrop-blur-xl text-primary border-b border-outline-variant/20 justify-center items-center px-4 h-16 z-50">
        <Link href={brandHref} className="flex items-center gap-1.5 cursor-pointer">
          <img src="/logo.svg" alt="LinkNyter Logo" className="h-6 w-auto" />
          <h1 className="font-display-lg text-[24px] tracking-tighter text-primary font-bold">LinkNyter</h1>
        </Link>
      </header>

      {/* Main Content Rendered Here */}
      {children}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="flex md:hidden fixed bottom-0 left-0 w-full z-50 justify-around items-center px-2 pb-safe h-20 bg-surface-container/90 backdrop-blur-xl border-t border-outline-variant/20 rounded-t-3xl">
        <Link href="/dashboard" className={`flex flex-col items-center justify-center transition-colors active:scale-90 transition-transform duration-200 ${pathname === '/dashboard' ? 'text-primary' : 'text-on-surface-variant hover:text-primary-fixed-dim'}`}>
          <LayoutGrid className="w-6 h-6" />
          <span className="font-label-caps text-[10px] tracking-widest mt-1">Library</span>
          {pathname === '/dashboard' && <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_#8B5CF6]"></div>}
        </Link>
        <Link href="/manage-links" className={`flex flex-col items-center justify-center transition-colors active:scale-90 transition-transform duration-200 ${pathname === '/manage-links' ? 'text-primary' : 'text-on-surface-variant hover:text-primary-fixed-dim'}`}>
          <LinkIcon className="w-6 h-6" />
          <span className="font-label-caps text-[10px] tracking-widest mt-1">Share Links</span>
          {pathname === '/manage-links' && <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_#8B5CF6]"></div>}
        </Link>
        <Link href="/analytics" className={`flex flex-col items-center justify-center transition-colors active:scale-90 transition-transform duration-200 ${pathname === '/analytics' ? 'text-primary' : 'text-on-surface-variant hover:text-primary-fixed-dim'}`}>
          <BarChart2 className="w-6 h-6" />
          <span className="font-label-caps text-[10px] tracking-widest mt-1">Analytics</span>
          {pathname === '/analytics' && <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_#8B5CF6]"></div>}
        </Link>
        <Link href="/lrc-sync" className={`flex flex-col items-center justify-center transition-colors active:scale-90 transition-transform duration-200 ${pathname === '/lrc-sync' ? 'text-primary' : 'text-on-surface-variant hover:text-primary-fixed-dim'}`}>
          <ListMusic className="w-6 h-6" />
          <span className="font-label-caps text-[10px] tracking-widest mt-1">Sync Lyrics</span>
          {pathname === '/lrc-sync' && <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_#8B5CF6]"></div>}
        </Link>
        <Link href="/profile" className={`flex flex-col items-center justify-center transition-colors active:scale-90 transition-transform duration-200 ${pathname === '/profile' ? 'text-primary' : 'text-on-surface-variant hover:text-primary-fixed-dim'}`}>
          <User className="w-6 h-6" />
          <span className="font-label-caps text-[10px] tracking-widest mt-1">Profile</span>
          {pathname === '/profile' && <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_#8B5CF6]"></div>}
        </Link>
      </nav>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardProvider>
  );
}
