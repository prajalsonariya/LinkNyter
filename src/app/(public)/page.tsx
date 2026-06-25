"use client";

import { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

export default function Homepage() {
  const { data: session } = useSession();

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-10');
        }
      });
    }, observerOptions);

    document.querySelectorAll('section').forEach(section => {
      section.classList.add('transition-all', 'duration-1000', 'opacity-0', 'translate-y-10');
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="overflow-x-hidden min-h-screen">
      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant/30 h-20">
        <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-full w-full max-w-container-max mx-auto">
          <div className="flex items-center gap-1.5 md:gap-2">
            <img src="/logo.svg" alt="LinkNyter Logo" className="h-8 md:h-10 w-auto" />
            <div className="font-headline-md text-headline-md font-bold tracking-tighter text-on-surface">LinkNyter</div>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link className="text-primary font-bold border-b border-primary py-1" href="/">The App</Link>
            <Link className="text-on-surface-variant hover:text-on-surface transition-colors font-body-lg text-body-lg" href="/">Why it&apos;s $0</Link>
            <Link className="text-on-surface-variant hover:text-on-surface transition-colors font-body-lg text-body-lg" href="/">Anti-Theft</Link>
            <Link className="text-on-surface-variant hover:text-on-surface transition-colors font-body-lg text-body-lg" href="/">No Nerdy Stuff</Link>
          </div>
          
          <div className="flex items-center gap-4">
            {session ? (
              <Link href="/dashboard" className="bg-primary text-on-primary px-6 py-2 rounded font-bold hover:opacity-80 active:scale-95 transition-all">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <button 
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })} 
                  className="text-on-surface-variant hover:text-on-surface transition-colors font-body-lg text-body-lg hidden sm:block"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })} 
                  className="bg-primary text-on-primary px-6 py-2 rounded font-bold hover:opacity-80 active:scale-95 transition-all"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* Section 1: Hero */}
        <section className="relative min-h-[870px] flex flex-col items-center justify-center text-center px-margin-mobile md:px-margin-desktop py-24">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(139,92,246,0.15)_0%,rgba(13,14,18,0)_70%)] -z-10 pointer-events-none"></div>
          
          <h1 className="font-display-lg text-[48px] md:text-[84px] leading-tight font-extrabold tracking-tighter max-w-4xl text-on-surface mb-8">
            Your unreleased tracks deserve better.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl mb-12 leading-relaxed">
            Look, sending your unreleased masterpieces via clunky text DMs or ugly cloud folders looks terrible. LinkNyter slaps a gorgeous visual jacket over your audio files instantly. It is 100% free, doesn&apos;t compress your audio into mush, and requires exactly zero brain cells to use. Built because being a student musician is already expensive enough.
          </p>
          
          {session ? (
            <Link href="/dashboard" className="bg-[#8b5cf6] text-white px-10 py-4 rounded-lg font-bold text-lg active:shadow-[0_0_30px_2px_rgba(139,92,246,0.15)] hover:brightness-110 transition-all duration-300">
              Go to Dashboard
            </Link>
          ) : (
            <button 
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })} 
              className="bg-[#8b5cf6] text-white px-10 py-4 rounded-lg font-bold text-lg active:shadow-[0_0_30px_2px_rgba(139,92,246,0.15)] hover:brightness-110 transition-all duration-300"
            >
              Become a Cool Musician 😎
            </button>
          )}

          {/* Decorative element */}
          <div className="mt-24 w-full max-w-5xl aspect-[16/9] bg-surface/80 backdrop-blur-[20px] border border-[#222226] rounded-xl overflow-hidden relative group">
            <div 
              className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
              style={{ backgroundImage: "url('/Homepage-demo-image.jpg')" }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
          </div>
        </section>

        {/* Section 2: Core Manifesto */}
        <section className="px-margin-mobile md:px-margin-desktop py-24 max-w-container-max mx-auto">
          <div className="bg-surface p-12 md:p-20 border border-outline-variant/20 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
            <div className="max-w-3xl">
              <span className="font-label-caps text-label-caps text-primary tracking-widest uppercase mb-4 block">THE MANIFESTO</span>
              <p className="font-headline-lg text-headline-lg md:text-[40px] leading-tight text-on-surface font-medium">
                Built by the student, for the student, of the student.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: 4-Column Feature Grid */}
        <section className="px-margin-mobile md:px-margin-desktop py-24 max-w-container-max mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
            <div className="p-8 border border-outline-variant/20 flex flex-col gap-6 hover:bg-surface-container-low transition-colors duration-300 group">
              <span className="material-symbols-outlined text-primary text-4xl group-hover:scale-110 transition-transform">graphic_eq</span>
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Audio Playback</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Google Drive is notoriously awful at playing music files. To fix it, we built a custom proxy system. When a listener clicks your link, our website acts as a fast middleman, it grabs your heavy raw file from your Drive in the background, chops it into tiny streamable bite-sized pieces, and feeds it to the browser instantly. No buffering wheels, and zero lag. It just works.</p>
              </div>
            </div>

            <div className="p-8 border border-outline-variant/20 flex flex-col gap-6 hover:bg-surface-container-low transition-colors duration-300 group">
              <span className="material-symbols-outlined text-primary text-4xl group-hover:scale-110 transition-transform">encrypted</span>
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-3">The &quot;Don&apos;t Steal My Music&quot; Switch</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Your unreleased tracks are your intellectual property. If you want people to listen but strictly forbid them from ripping your file, just flick the download switch to off on your dashboard. The download button completely vanishes for the listener. If you turn it on, they get the raw, high-res file. You have total control.</p>
              </div>
            </div>

            <div className="p-8 border border-outline-variant/20 flex flex-col gap-6 hover:bg-surface-container-low transition-colors duration-300 group">
              <span className="material-symbols-outlined text-primary text-4xl group-hover:scale-110 transition-transform">analytics</span>
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-3">The &quot;Did They Actually Listen?&quot; Tracker</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Stop biting your nails wondering if that manager, singer, or friend actually opened your link. Your dashboard keeps a dead-simple tally. Every single time someone hits play, the counter ticks up in real-time.</p>
              </div>
            </div>

            <div className="p-8 border border-outline-variant/20 flex flex-col gap-6 hover:bg-surface-container-low transition-colors duration-300 group">
              <span className="material-symbols-outlined text-primary text-4xl group-hover:scale-110 transition-transform">person_apron</span>
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-3">All Your Links in One Place</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Don&apos;t just send a lonely audio file. This engine lets you glue your artist profile, song descriptions, custom artwork, and all your social media links directly onto the playback page. It takes five seconds to set up, and even a 50-year-old grandma could do it.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Architecture Transparency Block */}
        <section className="px-margin-mobile md:px-margin-desktop py-32 max-w-container-max mx-auto border-t border-outline-variant/20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="w-full aspect-square bg-surface/80 backdrop-blur-[20px] border border-[#222226] rounded-2xl overflow-hidden relative">
                <div 
                  className="w-full h-full bg-cover bg-center hover:scale-105 transition-transform duration-700"
                  style={{ backgroundImage: "url('/cover-placeholder.jpg')" }}
                ></div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <h2 className="font-display-lg text-display-lg text-on-surface mb-8">Seriously, we don&apos;t want your files.</h2>
              <div className="space-y-6 text-on-surface-variant font-body-lg text-body-lg">
                <p>
                  Storing massive music files on our own servers costs a ton of money, and we have exactly zero dollars. So, we designed a clever workaround: LinkNyter connects securely to your personal, free Google Drive account.
                </p>
                <p>
                  When you drag and drop a track onto our dashboard, it flies straight into a secure folder in your own Drive. Our website simply acts as a fast, beautiful middleman that safely displays your music to the world. Because you are using your own free storage space, we never have to pay massive server bills, which means we never have to charge you a single penny. Your data stays 100% yours.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pre-footer CTA */}
        <section className="py-32 bg-surface-container-lowest text-center">
          <div className="px-margin-mobile max-w-3xl mx-auto">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-8">Stop gatekeeping your unreleased music.</h2>
            {session ? (
              <Link href="/dashboard" className="bg-on-surface text-background px-12 py-4 rounded-lg font-bold hover:bg-primary transition-colors">
                Go to Dashboard
              </Link>
            ) : (
              <button 
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })} 
                className="bg-on-surface text-background px-12 py-4 rounded-lg font-bold hover:bg-primary transition-colors"
              >
                Give Me a Link
              </button>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/20 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-margin-desktop max-w-container-max mx-auto">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-1.5 md:gap-2">
              <img src="/logo.svg" alt="LinkNyter Logo" className="h-8 md:h-10 w-auto self-start" />
              <div className="font-headline-md text-headline-md font-bold text-on-surface">LinkNyter</div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">© 2026 Solnyter Ecosystem. No corporate suits allowed.</p>
          </div>
          <div className="flex flex-col md:items-end justify-between gap-6">
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-sm text-body-sm hover:underline" href="/terms">Terms</Link>
              <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-sm text-body-sm hover:underline" href="/privacy">Privacy</Link>
              <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-sm text-body-sm hover:underline" href="/">Twitter</Link>
              <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-sm text-body-sm hover:underline" href="/">GitHub</Link>
              <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-sm text-body-sm hover:underline" href="/">Status</Link>
            </div>
            <div className="text-on-surface-variant font-label-caps text-xs tracking-widest uppercase">
              MADE BY STUDENT. FOR STUDENTS.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
