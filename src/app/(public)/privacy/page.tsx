export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-24 px-margin-mobile md:px-margin-desktop text-on-background">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display-lg text-[40px] md:text-display-lg font-bold mb-4 text-on-surface tracking-tighter">Privacy Policy</h1>
        <p className="font-body-md text-on-surface-variant mb-12 uppercase tracking-widest font-medium">Last Updated: June 25, 2026</p>

        <div className="space-y-12 font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
          <p>
            LinkNyter (&quot;we,&quot; &quot;our,&quot; or &quot;the Platform&quot;) operates as a specialized presentation and proxy streaming interface for independent musicians. This Privacy Policy outlines our strict data handling practices and explains how your personal information and cloud storage files are managed when you use our service.
          </p>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">1. Information We Collect</h2>
            <p className="mb-4">To provide our core utility, LinkNyter collects only the minimal technical data required to authenticate your account and route your audio assets:</p>
            <ul className="list-disc pl-5 space-y-3">
              <li><strong className="text-on-surface">Account Information:</strong> When you log in via Google OAuth, we receive your email address, name, and profile avatar to create your personal creator profile.</li>
              <li><strong className="text-on-surface">Track Metadata:</strong> We collect and store text-based information that you explicitly type into the application dashboard, including song titles, track descriptions, and your linked social media profile handles.</li>
              <li><strong className="text-on-surface">Authentication Tokens:</strong> We securely store encrypted OAuth refresh tokens provided by Google to maintain your cloud integration.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">2. Google Drive Access & Zero-Custody Model</h2>
            <p className="mb-4">LinkNyter operates on a non-custodial data model. We do not own, manage, or maintain separate cloud servers to host your audio files or cover art:</p>
            <ul className="list-disc pl-5 space-y-3">
              <li><strong className="text-on-surface">Application Scope:</strong> Our access is strictly restricted via Google API permissions to the specific application folder created inside your personal Google Drive account. We cannot view, read, modify, or delete any other files or folders in your personal storage.</li>
              <li><strong className="text-on-surface">File Ownership:</strong> Your raw audio files (WAV, AIFF, FLAC, MP3) and image assets fly directly into your personal Google Drive storage bucket. LinkNyter does not store copies of your raw binary audio files on our infrastructure.</li>
              <li><strong className="text-on-surface">No Admin Access:</strong> The platform administrator has no technical means to view, download, or access the contents of your private Google Drive folder. Your files remain entirely under your personal custody and control.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">3. How Data is Processed (Proxy Streaming)</h2>
            <p className="mb-4">When a public listener accesses a shared track link:</p>
            <ul className="list-disc pl-5 space-y-3">
              <li>Our server infrastructure acts as a temporary streaming proxy. It fetches the audio binary directly from your personal Google Drive server in the background and converts it into small data packets for the listener&apos;s web browser.</li>
              <li>This data processing happens entirely in volatile memory. Your raw files are not permanently written, cached, or saved onto our server disks during this streaming process.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">4. Data Retention and Deletion</h2>
            <p className="mb-4">You maintain complete control over your metadata and assets at all times:</p>
            <ul className="list-disc pl-5 space-y-3">
              <li>If you delete a track from your LinkNyter dashboard, the corresponding row of text metadata (title, description, play count) is instantly permanently purged from our database.</li>
              <li>You can revoke LinkNyter&apos;s API access at any moment directly through your personal Google Account security settings, immediately disconnecting the platform from your storage.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">5. Third-Party Sharing</h2>
            <p>
              We do not sell, rent, lease, or trade your personal information, metadata, or tracking metrics to third-party advertising companies or data brokers. Data is processed exclusively to maintain the live playback interface.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
