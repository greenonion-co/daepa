import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

import { DEFAULT_OG_IMAGE } from "@/lib/metadata";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import AppShell from "./components/AppShell";
import { Suspense } from "react";
import LoadingScreen from "@/app/loading";
import OfflineBanner from "@/components/common/OfflineBanner";
import { AppInstallPrompt } from "@/components/AppInstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://breedy.kr"),
  title: {
    default: "BREEDY",
    template: "%s | BREEDY",
  },
  description: "모든 브리더를 위한 프리미엄 파충류 관리 · 브리딩 · 세일즈 솔루션",
  openGraph: {
    siteName: "BREEDY",
    locale: "ko_KR",
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE, width: 512, height: 512 }],
  },
  twitter: {
    card: "summary",
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Script
          src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
          strategy="beforeInteractive"
        />
        <Providers>
          <Toaster />
          <OfflineBanner />
          <Suspense fallback={null}>
            <AppInstallPrompt />
          </Suspense>
          <Suspense fallback={<LoadingScreen />}>
            <AppShell>{children}</AppShell>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
