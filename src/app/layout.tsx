import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";

import { appBaseUrl, brandDescription, brandName } from "@/lib/brand";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl()),
  title: brandName,
  description: brandDescription,
  icons: {
    icon: "/restshore/logo-badge.svg",
    shortcut: "/restshore/logo-badge.svg",
    apple: "/restshore/logo-badge.svg",
  },
  openGraph: {
    title: brandName,
    description: brandDescription,
    images: [
      {
        url: "/restshore/og-image.png",
        width: 1536,
        height: 1024,
        alt: `${brandName} launch illustration`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: brandName,
    description: brandDescription,
    images: ["/restshore/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${fraunces.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
