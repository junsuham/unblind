import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "언블라인드",
  description: "청년의 때 고민과 기도제목을 나누는 익명 공간",
};

export const viewport: Viewport = {
  themeColor: "#ff4b00",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
