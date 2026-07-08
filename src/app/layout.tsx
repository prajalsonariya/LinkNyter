import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkNyter",
  description: "Secure, high-performance web-streaming links for listeners and audio professionals.",
  applicationName: "LinkNyter",
  authors: [{ name: "LinkNyter" }],
  keywords: ["LinkNyter", "audio delivery", "audio streaming", "music sharing", "secure audio links", "Link Nyter"],
  robots: "index, follow",
  openGraph: {
    type: "website",
    url: "https://linknyter.com",
    title: "LinkNyter",
    description: "Secure, high-performance web-streaming links for listeners.",
    siteName: "LinkNyter",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkNyter",
    description: "Secure, high-performance web-streaming links for listeners.",
  },
};

import { Providers } from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-surface-container-lowest text-on-surface font-body-lg min-h-screen selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
