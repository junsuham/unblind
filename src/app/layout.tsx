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
  description: "청년의 때 고민과 기도 제목을 나누는 익명 공간",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    // Keep the orange header edge-to-edge. The bottom system area is matched
    // separately through themeColor and the root safe-area background.
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
      { url: "/icons/icon-192-v6.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512-v6.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon-v6.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e45330" },
    { media: "(prefers-color-scheme: dark)", color: "#100d0c" },
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
