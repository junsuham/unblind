import type { Metadata, Viewport } from "next";
import { PwaLifecycle } from "@/app/components/PwaLifecycle";
import { AppLaunchSplash } from "@/app/components/AppLaunchSplash";
import { GlobalPraisePlayer } from "@/app/components/GlobalPraisePlayer";
import { ConnectionStatus } from "@/app/components/ConnectionStatus";
import { WebVitalsReporter } from "@/app/components/WebVitalsReporter";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "언블라인드",
  title: "언블라인드",
  description: "청년의 때 고민과 기도제목을 나누는 익명 공간",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "언블라인드",
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192-v4.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512-v4.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon-v4.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1c1e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AppLaunchSplash />
        {children}
        <GlobalPraisePlayer />
        <PwaLifecycle />
        <ConnectionStatus />
        <WebVitalsReporter />
      </body>
    </html>
  );
}
