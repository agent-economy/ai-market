import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthProvider } from "@/contexts/AuthContext";
import { SolanaWalletProvider } from "@/contexts/WalletContext";
import { routing } from "@/i18n/routing";
import "../globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  const localeAlternates: Record<string, string> = {};
  for (const loc of routing.locales) {
    localeAlternates[loc] =
      loc === "ko"
        ? "https://agentmarket.kr"
        : `https://agentmarket.kr/${loc}`;
  }

  return {
    title: t("title"),
    description: t("description"),
    keywords: ["AI", "agent", "AgentMarket", "AI agent", "economy", "simulation"],
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "AgentMarket",
    },
    themeColor: "#6366F1",
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      type: "website",
      url: "https://agentmarket.kr",
      siteName: "AgentMarket",
      locale: locale === "ko" ? "ko_KR" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
      creator: "@agentmarket_kr",
    },
    alternates: {
      canonical:
        locale === "ko"
          ? "https://agentmarket.kr"
          : `https://agentmarket.kr/${locale}`,
      languages: localeAlternates,
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = (await import(`../../../messages/${locale}.json`)).default;

  // word-break: CJK languages handle differently
  const wordBreakClass =
    locale === "zh" ? "break-normal" : "";

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://generativelanguage.googleapis.com"
        />
        <meta name="naver-site-verification" content="" />
        <meta name="google-site-verification" content="" />
      </head>
      <body
        className={`${geistMono.variable} antialiased ${wordBreakClass}`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SolanaWalletProvider>
            <AuthProvider>{children}</AuthProvider>
          </SolanaWalletProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
