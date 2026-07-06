export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-24 px-margin-mobile md:px-margin-desktop text-on-background">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display-lg text-[40px] md:text-display-lg font-bold mb-4 text-on-surface tracking-tighter">Privacy Policy</h1>
        <p className="font-body-md text-on-surface-variant mb-12 uppercase tracking-widest font-medium">Last Updated: July 6, 2026</p>

        <div className="space-y-12 font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
          <p>
            LinkNyter (&quot;we,&quot; &quot;our,&quot; or &quot;the Platform&quot;) operates as a specialized presentation and proxy streaming interface for independent musicians. This Privacy Policy outlines our strict data handling practices and explains how your personal information and cloud storage files are managed when you use our service.
          </p>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">1. Information We Collect</h2>
            <p className="mb-4">To provide our core utility, LinkNyter collects only the minimal technical data required to authenticate your account and route your audio assets.</p>
            <ul className="list-disc pl-5 space-y-3">
              <li><strong className="text-on-surface">Account Information:</strong> When you log in via Google OAuth, we receive your email address, name, and profile avatar to create your personal creator profile.</li>
              <li><strong className="text-on-surface">Track & Playlist Metadata:</strong> We collect and store text based information that you explicitly type into the application dashboard, including song titles, track descriptions, playlist configurations, synced LRC lyrics, and your linked social media profile handles.</li>
              <li><strong className="text-on-surface">Authentication Tokens:</strong> We securely store encrypted OAuth refresh tokens provided by Google to maintain your cloud integration.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">2. Google Drive Access and Zero Custody Storage Model</h2>
            <p className="mb-4">LinkNyter operates on a non custodial data model. We do not own, manage, or maintain separate cloud servers to host your audio files or cover art.</p>
            <ul className="list-disc pl-5 space-y-3">
              <li><strong className="text-on-surface">Application Scope:</strong> Our access is strictly restricted via Google API permissions to the specific application folder created inside your personal Google Drive account. We cannot view, read, modify, or delete any other files or folders in your personal storage.</li>
              <li><strong className="text-on-surface">File Ownership:</strong> Your raw audio files and image assets fly directly into your personal Google Drive storage bucket. LinkNyter does not store copies of your raw binary audio files on our infrastructure.</li>
              <li><strong className="text-on-surface">No Admin Access:</strong> The platform administrator has no technical means to view, download, or access the contents of your private Google Drive folder. Your files remain entirely under your personal custody and control.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">3. How Data is Processed via Proxy Streaming</h2>
            <p className="mb-4">When a public listener accesses a shared track link:</p>
            <ul className="list-disc pl-5 space-y-3">
              <li>Our server infrastructure acts as a temporary streaming proxy. It fetches the audio binary directly from your personal Google Drive server in the background and converts it into small data packets for the listener browser.</li>
              <li>This data processing happens entirely in volatile memory. Your raw files are not permanently written, cached, or saved onto our server disks during this streaming process.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">4. Analytics, Telemetry, and Listener Tracking</h2>
            <p className="mb-4">LinkNyter employs advanced telemetry to provide creators with detailed playback analytics isolated by individual custom tracking links. When a public listener opens a tracking link for a track or playlist, we collect specific behavioral and session metrics.</p>
            <ul className="list-disc pl-5 space-y-3">
              <li><strong className="text-on-surface">Link-Level Attribution:</strong> We track real-time playback events, play counts, and unique listener interactions mapped directly to the specific custom tracking links you generate.</li>
              <li><strong className="text-on-surface">Behavioral Metrics:</strong> We calculate total completion percentage, track abandonment rates, and specific user interface interactions (such as downloads) to provide aggregated deep-dive analytics on a per-link and per-track basis.</li>
              <li><strong className="text-on-surface">Session and Technical Data:</strong> We utilize anonymized session identifiers and basic technical parameters to differentiate unique listeners and aggregate temporal playback statistics. This data is strictly partitioned and only accessible via your authenticated creator dashboard.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">5. Custom Tracking Links and Recipient Data</h2>
            <p className="mb-4">The Platform provides a &quot;Manage Links&quot; utility allowing creators to generate isolated, trackable URLs for specific recipients or campaigns.</p>
            <ul className="list-disc pl-5 space-y-3">
              <li><strong className="text-on-surface">Reference Data:</strong> If you input personal information (such as a recipient&apos;s name or corporate affiliation) into the link generation tool as a &quot;Reference Name,&quot; this text is stored securely in our database.</li>
              <li><strong className="text-on-surface">Data Processing:</strong> We do not process this reference data for any purpose other than displaying it within your private dashboard for campaign management.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">6. Data Retention and Deletion</h2>
            <p className="mb-4">You maintain complete control over your metadata and assets at all times.</p>
            <ul className="list-disc pl-5 space-y-3">
              <li>If you delete a track or a playlist from your LinkNyter dashboard, the corresponding row of text metadata and all associated playback analytics are instantly and permanently purged from our database.</li>
              <li>If you delete your entire LinkNyter account, all your music metadata, custom URLs, syncing data, and analytics will be wiped immediately and permanently.</li>
              <li>You can revoke LinkNyter API access at any moment directly through your personal Google Account security settings, immediately disconnecting the platform from your storage.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">7. Third Party Sharing</h2>
            <p>
              We do not sell, rent, lease, or trade your personal information, telemetry data, metadata, or tracking metrics to third party advertising companies or data brokers. Data is processed exclusively to maintain the live playback interface and populate your private creator dashboard.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
