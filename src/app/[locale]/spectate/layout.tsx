import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'spectateMetadata' });

  return {
    title: t('title'),
    description: t('description'),
    keywords: 'AI, agent, economy, experiment, spectate, trading, investment, USDC, crypto',
    authors: [{ name: 'AgentMarket' }],

    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: `https://agentmarket.kr${locale === 'en' ? '' : `/${locale}`}/spectate`,
      siteName: 'AgentMarket',
      locale: locale === 'ko' ? 'ko_KR' : 'en_US',
      type: 'website',
    },

    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('ogDescription'),
      creator: '@agentmarket_kr',
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default function SpectateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
