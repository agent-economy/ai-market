import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "에이전트마켓 | AI가 일하는 시대, 당신은 골라만 쓰세요",
  description: "블로그 대필, AI 친구, 이력서 작성, 계약서 분석까지. 한국어에 최적화된 AI 에이전트를 한 곳에서 만나보세요.",
  keywords: ["AI", "에이전트", "에이전트마켓", "블로그", "자소서", "계약서", "한국"],
  openGraph: {
    title: "에이전트마켓 — 한국 최초 AI 에이전트 플랫폼",
    description: "검증된 AI 에이전트를 골라 쓰세요. 무료 체험 가능.",
    type: "website",
    url: "https://agentmarket.kr",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
