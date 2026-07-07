export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-24 px-margin-mobile md:px-margin-desktop text-on-background">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display-lg text-[40px] md:text-display-lg font-bold mb-4 text-on-surface tracking-tighter">Terms and Conditions</h1>
        <p className="font-body-md text-on-surface-variant mb-12 uppercase tracking-widest font-medium">Last Updated: July 6, 2026</p>

        <div className="space-y-12 font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
          <p>
            Welcome to LinkNyter. By using our website and streaming tools, you agree to these Terms and Conditions. We&apos;ve tried to keep them as straightforward and human-readable as possible.
          </p>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">1. What LinkNyter Is</h2>
            <p>
              LinkNyter is an interface that connects to your Google Drive to help you share your music. We don&apos;t provide data storage—your files stay safely in your own cloud account. We just provide the tools to stream and present them beautifully.
            </p>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">2. Your Account</h2>
            <p className="mb-4">You log in using your Google account. You are responsible for:</p>
            <ul className="list-disc pl-5 space-y-3">
              <li>Keeping your Google account secure.</li>
              <li>Anything that happens under your LinkNyter account.</li>
              <li>Making sure your Google Drive has enough space to host your music.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">3. You Own Your Music</h2>
            <p className="mb-4">You (the Creator) keep full ownership and copyright of all your music, artwork, and text.</p>
            <ul className="list-disc pl-5 space-y-3">
              <li><strong className="text-on-surface">No Rights Transferred:</strong> We claim zero ownership over your files or creative works.</li>
              <li><strong className="text-on-surface">Permission to Stream:</strong> By using LinkNyter, you give us permission to access and stream your files solely so we can make your music playable for your listeners.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">4. Rules of the Road</h2>
            <p className="mb-4">You are responsible for what you share. You agree not to use LinkNyter to upload or share anything that:</p>
            <ul className="list-disc pl-5 space-y-3 mb-6">
              <li>Infringes on someone else&apos;s copyright, trademark, or privacy.</li>
              <li>Contains viruses or malicious code.</li>
              <li>Breaks the law.</li>
            </ul>
            <p>
              If we find out you are using LinkNyter to distribute pirated music or unauthorized content, we reserve the right to delete your account and links immediately.
            </p>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">5. Custom Links</h2>
            <p>
              You can generate Custom Links for specific campaigns or people. Please don&apos;t type sensitive personal information (like passwords or social security numbers) into the link reference fields. LinkNyter just stores the text you give us to help you manage your links.
            </p>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">6. Using Analytics</h2>
            <p>
              The analytics we provide are strictly to help you understand how your music is performing. You agree not to use our analytics tools to harass anyone or attempt to uncover the personal identities of your listeners.
            </p>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">7. Google&apos;s Rules Apply Too</h2>
            <p>
              Because LinkNyter connects directly to your Google Drive, you also have to follow Google&apos;s Terms of Service. We aren&apos;t responsible if Google throttles your bandwidth or suspends your account for breaking their rules.
            </p>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">8. Things Out of Our Control</h2>
            <p className="mb-4">LinkNyter is provided &quot;as-is&quot; without any warranties.</p>
            <ul className="list-disc pl-5 space-y-3 mb-6">
              <li>We work hard to keep the service running smoothly, but we can&apos;t guarantee it will be 100% bug-free or secure all the time.</li>
              <li>Since we don&apos;t store your files, we aren&apos;t responsible for any lost data or Google Drive outages.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">9. Changes to These Terms</h2>
            <p>
              We might update these terms occasionally as the platform grows. If you keep using LinkNyter after we make changes, it means you agree to the new terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
