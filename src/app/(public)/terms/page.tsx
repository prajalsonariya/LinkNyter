export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-24 px-margin-mobile md:px-margin-desktop text-on-background">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display-lg text-[40px] md:text-display-lg font-bold mb-4 text-on-surface tracking-tighter">Terms and Conditions</h1>
        <p className="font-body-md text-on-surface-variant mb-12 uppercase tracking-widest font-medium">Last Updated: June 25, 2026</p>

        <div className="space-y-12 font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
          <p>
            Welcome to LinkNyter (&quot;the Service,&quot; &quot;the Platform&quot;). By accessing or using our website, dashboard, and proxy streaming services, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, you must immediately discontinue your use of the Platform.
          </p>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">1. Description of Service</h2>
            <p>
              LinkNyter provides a specialized, non-custodial presentation and proxy streaming interface that integrates with your personal Google Drive storage. The Service functions exclusively as a visual and technical wrapper to display, stream, and manage access to audio files hosted within your own cloud account. LinkNyter does not provide data storage infrastructure for your audio or image assets.
            </p>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">2. User Accounts and Authentication</h2>
            <p className="mb-4">To utilize the Service, you must authenticate your identity via Google OAuth. You are entirely responsible for:</p>
            <ul className="list-disc pl-5 space-y-3">
              <li>Maintaining the security of your Google account credentials.</li>
              <li>All activities, uploads, and modifications performed under your LinkNyter account session.</li>
              <li>Ensuring that your personal Google Drive account maintains sufficient storage capacity to receive and serve your uploaded assets.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">3. Intellectual Property and Content Ownership</h2>
            <p className="mb-4">You retain full ownership, copyright, and intellectual property rights to all audio files, track metadata, cover art, and description text that you process through the Platform.</p>
            <ul className="list-disc pl-5 space-y-3">
              <li><strong className="text-on-surface">No Rights Transferred:</strong> LinkNyter claims no ownership over your files or creative works.</li>
              <li><strong className="text-on-surface">Limited Processing License:</strong> By uploading assets, you grant LinkNyter a strictly limited, non-exclusive, worldwide license to access, retrieve, chunk, and transmit your data for the sole purpose of rendering your public listening page and executing proxy audio streams to authorized listeners.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">4. Acceptable Use and Restrictions</h2>
            <p className="mb-4">You are solely responsible for the legality of the content you distribute through LinkNyter. You explicitly agree that you will not upload, share, or transmit any audio files or material that:</p>
            <ul className="list-disc pl-5 space-y-3 mb-6">
              <li>Infringes upon the intellectual property, copyright, trademark, or privacy rights of any third party.</li>
              <li>Contains malicious software code, viruses, or scripts designed to disrupt the Service or Google API infrastructure.</li>
              <li>Violates local, state, national, or international laws.</li>
            </ul>
            <p>
              The Platform reserves the right to immediately terminate user account access and delete associated text metadata if a user is found to be distributing pirated or unauthorized material.
            </p>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">5. Google Drive API Policy Compliance</h2>
            <p>
              Because LinkNyter relies directly on third-party cloud APIs to fetch and route data, your use of the Service is simultaneously governed by the Google Terms of Service and Google Drive Additional Terms of Service. LinkNyter is not liable for service disruptions, bandwidth throttling, account suspensions, or download quotas enforced on your cloud account by Google.
            </p>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">6. Limitation of Liability and Disclaimer of Warranties</h2>
            <p className="mb-4">LinkNyter is provided on an &quot;as-is&quot; and &quot;as-available&quot; basis without warranties of any kind, either express or implied.</p>
            <ul className="list-disc pl-5 space-y-3 mb-6">
              <li>We do not guarantee that the Service will be uninterrupted, completely secure, or entirely error-free.</li>
              <li>LinkNyter acts solely as a presentation middleman and shall not be held liable for any loss of data, file corruption, backend API failures, or financial damages arising from your use of the platform or dependencies on third-party storage providers.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold mb-6">7. Modifications to Service and Terms</h2>
            <p>
              We reserve the right to modify, update, or temporarily discontinue sections of this free Service at any time to accommodate changing cloud API frameworks or operational server constraints. Continued use of the Platform following any modifications constitutes formal acceptance of the updated Terms and Conditions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
