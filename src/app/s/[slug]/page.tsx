import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type PageData = {
  slug: string;
  title: string;
  description: string | null;
  html_content: string;
  source: 'hosted_pages' | 'sites';
};

type Props = {
  params: Promise<{ slug: string }>;
};

/**
 * hosted_pages → sites 순서로 조회
 */
async function getPageBySlug(slug: string): Promise<PageData | null> {
  // 1) hosted_pages 먼저 확인
  const { data: hostedPage } = await supabase
    .from('hosted_pages')
    .select('slug, title, description, html_content')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (hostedPage) {
    return { ...hostedPage, source: 'hosted_pages' };
  }

  // 2) 기존 sites 테이블 fallback
  const { data: site } = await supabase
    .from('sites')
    .select('slug, title, description, html_content')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (site) {
    return { ...site, source: 'sites' };
  }

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) {
    return { title: '페이지를 찾을 수 없습니다' };
  }

  const title = page.title || slug;
  const description = page.description || `${slug} — Made with AgentMarket`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://agentmarket.kr/s/${slug}`,
      siteName: 'AgentMarket',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function HostedPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  // 조회수 증가 (fire and forget)
  if (page.source === 'hosted_pages') {
    supabase.rpc('increment_view_count', { page_slug: slug }).then(() => {});
  } else {
    supabase.rpc('increment_site_views', { site_slug: slug }).then(() => {});
  }

  // 하단 워터마크 뱃지 (무료 tier)
  const watermark = `
    <div style="position:fixed;bottom:16px;right:16px;z-index:9999;font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;">
      <a href="https://agentmarket.kr" target="_blank" rel="noopener noreferrer"
         style="display:flex;align-items:center;gap:6px;padding:8px 14px;background:rgba(255,255,255,0.95);border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.12);text-decoration:none;color:#4f46e5;font-size:12px;font-weight:600;backdrop-filter:blur(8px);border:1px solid rgba(79,70,229,0.15);transition:all 0.2s ease;">
        <span style="font-size:14px;">🚀</span>
        <span>Powered by AgentMarket</span>
      </a>
    </div>
  `;

  // </body> 앞에 워터마크 삽입
  const htmlWithWatermark = page.html_content.includes('</body>')
    ? page.html_content.replace('</body>', `${watermark}</body>`)
    : page.html_content + watermark;

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh',
      margin: 0,
      padding: 0,
    }}>
      <iframe
        srcDoc={htmlWithWatermark}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
        title={page.title || slug}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    </div>
  );
}
