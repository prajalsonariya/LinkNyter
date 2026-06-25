"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { LayoutGrid, BarChart2, User, Shield, UploadCloud, LogOut } from "lucide-react";
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
        <p className="text-on-surface-variant max-w-md text-body-lg">A secure, zero-cost presentation and delivery layer for your audio files.</p>
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

      {/* Left Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-outline-variant bg-surface/80 backdrop-blur-xl flex flex-col py-margin-desktop px-gutter z-50">
        <div className="mb-10">
          <div className="flex items-center gap-1.5 mb-2">
            <img src="/logo.svg" alt="LinkNyter Logo" className="h-8 md:h-10 w-auto" />
            <h1 className="font-display-lg text-[32px] font-bold text-primary tracking-tighter">LinkNyter</h1>
          </div>
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Creator Studio</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          <Link href="/dashboard" className={`flex items-center gap-3 py-3 px-4 rounded transition-all w-full ${pathname === '/dashboard' ? 'text-primary font-bold border-r-2 border-primary bg-surface-container-high active:scale-95 duration-100' : 'text-on-surface-variant font-body-sm hover:bg-surface-container-high'}`}>
            <LayoutGrid className="w-5 h-5" />
            <span className="font-label-caps text-label-caps">Dashboard</span>
          </Link>
          <Link href="/analytics" className={`flex items-center gap-3 py-3 px-4 rounded transition-all w-full ${pathname === '/analytics' ? 'text-primary font-bold border-r-2 border-primary bg-surface-container-high active:scale-95 duration-100' : 'text-on-surface-variant font-body-sm hover:bg-surface-container-high'}`}>
            <BarChart2 className="w-5 h-5" />
            <span className="font-label-caps text-label-caps">Analytics</span>
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

      {/* Main Content Rendered Here */}
      {children}
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
