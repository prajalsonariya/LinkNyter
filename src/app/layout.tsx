import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkNyter | Professional Audio Delivery",
  description: "Secure, high-performance web-streaming links for listeners.",
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
      </head>
      <body className="bg-surface-container-lowest text-on-surface font-body-lg min-h-screen selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
