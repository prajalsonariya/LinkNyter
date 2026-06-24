export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-on-background p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-on-surface-variant mb-4">
        This is a placeholder for the Terms of Service. Update this file with the official terms for LinkNyter.
      </p>
      <div className="space-y-4 text-sm text-on-surface-variant">
        <p>1. Service Usage: LinkNyter provides an interface to upload audio files to your personal Google Drive and share them via a custom audio player.</p>
        <p>2. Content Ownership: You retain full ownership of any content uploaded through LinkNyter. You are responsible for ensuring you have the right to share the content.</p>
        <p>3. Abuse: We reserve the right to revoke access to LinkNyter if the platform is used for illegal activities.</p>
      </div>
    </div>
  );
}
