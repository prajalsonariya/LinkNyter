export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-24 px-margin-mobile md:px-margin-desktop text-on-background">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display-lg text-[40px] md:text-display-lg font-bold mb-4 text-on-surface tracking-tighter">Privacy Policy</h1>
        <p className="font-body-md text-on-surface-variant mb-12 uppercase tracking-widest font-medium">Last Updated: July 6, 2026</p>

        <div className="space-y-12 font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
          <p>
            This Privacy Policy explains how LinkNyter handles your data. We believe in keeping things simple: you own your data, your files stay in your cloud, and we only collect what we need to make the service work.
          </p>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">1. What We Collect</h2>
            <p className="mb-4">We only collect the technical data necessary to run your account and stream your music.</p>
            <ul className="list-disc pl-5 space-y-3">
              <li><strong className="text-on-surface">Account Basics:</strong> When you log in with Google, we securely receive your email, name, and profile picture to set up your account.</li>
              <li><strong className="text-on-surface">What You Type:</strong> We store the text you enter into the dashboard, like song titles, track descriptions, playlist setups, and your social media links.</li>
              <li><strong className="text-on-surface">Access Tokens:</strong> We securely store Google authentication tokens so the app can stay connected to your Drive.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">2. Google Drive & File Storage</h2>
            <p className="mb-4">LinkNyter doesn&apos;t store your audio files. We use a non-custodial model, which means your files stay entirely under your control.</p>
            <ul className="list-disc pl-5 space-y-3">
              <li><strong className="text-on-surface">Restricted Access:</strong> We only request access to the specific &quot;LinkNyter&quot; folder created in your Google Drive. We physically cannot see, read, or edit any other files in your account.</li>
              <li><strong className="text-on-surface">File Ownership:</strong> Your music and artwork go directly to your Drive. We never keep copies of your raw files on our servers.</li>
              <li><strong className="text-on-surface">Total Control:</strong> You have complete custody of your files at all times.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">3. How Streaming Works</h2>
            <p className="mb-4">When a listener clicks play on your track:</p>
            <ul className="list-disc pl-5 space-y-3">
              <li>Our servers act as a temporary middleman. They fetch the audio directly from your Google Drive and stream it to the listener&apos;s browser.</li>
              <li>This happens entirely in temporary memory. We don&apos;t save or cache your files to our hard drives during this process.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">4. Analytics and Stats</h2>
            <p className="mb-4">We provide basic analytics so you can see how your music is performing.</p>
            <ul className="list-disc pl-5 space-y-3">
              <li><strong className="text-on-surface">Link Tracking:</strong> We track plays, downloads, and social link clicks for the tracks, playlists, and custom links you create.</li>
              <li><strong className="text-on-surface">Anonymous Sessions:</strong> We use temporary, anonymous session IDs to count unique listeners and track listening duration (retention). This data is completely anonymous and only visible to you.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">5. Custom Links</h2>
            <p className="mb-4">If you use the &quot;Manage Links&quot; feature to create custom URLs for specific campaigns or people, any reference name you type in is stored securely in our database. We only use this to show it to you in your dashboard.</p>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">6. Deleting Your Data</h2>
            <p className="mb-4">You are in control of your data.</p>
            <ul className="list-disc pl-5 space-y-3">
              <li>If you delete a track or playlist in the app, all its text data and analytics are instantly and permanently deleted from our database.</li>
              <li>If you delete your LinkNyter account, we immediately wipe all your music metadata, custom URLs, and analytics forever.</li>
              <li>You can revoke LinkNyter&apos;s access to your Google Drive at any time from your Google Account security settings.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">7. Third Parties</h2>
            <p>
              We do not sell, rent, or trade your personal information or analytics to advertisers or data brokers. Your data is used exclusively to keep the app running and to show you your stats.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
