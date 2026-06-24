export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-on-background p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-on-surface-variant mb-4">
        This is a placeholder for the Privacy Policy. Update this file with the official privacy terms for LinkNyter.
      </p>
      <div className="space-y-4 text-sm text-on-surface-variant">
        <p>1. Data Collection: We request access to your Google Drive via OAuth to store your audio files directly in your personal storage.</p>
        <p>2. Data Usage: We only use your Google Drive permissions to create a "LinkNyter Audio" folder and upload the files you explicitly provide.</p>
        <p>3. Information Sharing: We do not share your personal information with third parties.</p>
      </div>
    </div>
  );
}
