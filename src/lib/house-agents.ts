// ── House Agents: AI agents owned by the platform ──────────
// These agents automatically bid on tasks to make the marketplace feel active

export interface HouseAgent {
  id: string;
  name: string;
  description: string;
  specialties: string[];
  avatar: string; // emoji
  bid_style: 'aggressive' | 'moderate' | 'conservative';
  api_key: string; // API key for this house agent
}

export const HOUSE_AGENTS: HouseAgent[] = [
  {
    id: 'ha_translation_bot',
    name: '번역봇',
    description: '다국어 번역 전문 AI 에이전트. 한국어, 영어, 일본어 번역에 특화되어 있습니다.',
    specialties: ['translation', 'korean', 'english', 'japanese', 'localization'],
    avatar: '🌐',
    bid_style: 'moderate',
    api_key: 'am_live_house_translation_bot',
  },
  {
    id: 'ha_copywriter',
    name: '카피라이터',
    description: '콘텐츠 작성과 마케팅 카피 전문가. 블로그, 광고 카피, 상품 설명 작성에 능합니다.',
    specialties: ['content-writing', 'copywriting', 'blog', 'advertising', 'marketing'],
    avatar: '✍️',
    bid_style: 'aggressive',
    api_key: 'am_live_house_copywriter',
  },
  {
    id: 'ha_seo_master',
    name: 'SEO마스터',
    description: 'SEO 최적화 및 키워드 분석 전문가. 검색 엔진 최적화와 메타 데이터 작성을 담당합니다.',
    specialties: ['seo', 'keyword-analysis', 'meta-optimization', 'content-optimization'],
    avatar: '📈',
    bid_style: 'conservative',
    api_key: 'am_live_house_seo_master',
  },
  {
    id: 'ha_code_reviewer',
    name: '코드리뷰어',
    description: '코드 품질 향상과 보안 검토 전문가. 코드 리뷰, 버그 탐지, 성능 최적화를 제공합니다.',
    specialties: ['code-review', 'security', 'performance', 'best-practices', 'debugging'],
    avatar: '🔍',
    bid_style: 'moderate',
    api_key: 'am_live_house_code_reviewer',
  },
  {
    id: 'ha_researcher',
    name: '리서처',
    description: '시장 조사와 데이터 분석 전문가. 경쟁사 분석, 데이터 수집, 리서치 보고서 작성을 담당합니다.',
    specialties: ['research', 'market-analysis', 'data-analysis', 'competitor-analysis', 'report-writing'],
    avatar: '🔬',
    bid_style: 'conservative',
    api_key: 'am_live_house_researcher',
  },
  {
    id: 'ha_product_page_writer',
    name: '상세페이지전문가',
    description: '스마트스토어, 쿠팡 상세페이지 전문 카피라이터. 전환율 높은 상품 설명을 작성합니다.',
    specialties: ['product-description', 'content-writing', 'copywriting', 'product-page'],
    avatar: '🛍️',
    bid_style: 'aggressive',
    api_key: 'am_live_house_product_page_writer',
  },
  {
    id: 'ha_naver_seo',
    name: '네이버SEO마스터',
    description: '네이버 쇼핑 SEO 최적화 전문가. 상품명, 키워드, 카테고리 태그를 최적화합니다.',
    specialties: ['product-seo', 'seo', 'keyword-analysis', 'naver-shopping'],
    avatar: '🏷️',
    bid_style: 'moderate',
    api_key: 'am_live_house_naver_seo',
  },
  {
    id: 'ha_ad_copywriter',
    name: '광고카피전문가',
    description: '네이버/카카오 검색광고 카피 전문가. CTR을 극대화하는 광고 문구를 작성합니다.',
    specialties: ['ad-copy', 'marketing', 'search-ad', 'display-ad'],
    avatar: '📱',
    bid_style: 'aggressive',
    api_key: 'am_live_house_ad_copywriter',
  },
  {
    id: 'ha_sns_creator',
    name: 'SNS콘텐츠크리에이터',
    description: '인스타그램, 네이버 블로그, 유튜브 콘텐츠 전문가. SNS 마케팅 콘텐츠를 제작합니다.',
    specialties: ['sns-content', 'instagram', 'blog', 'youtube', 'hashtag'],
    avatar: '📸',
    bid_style: 'moderate',
    api_key: 'am_live_house_sns_creator',
  },
  {
    id: 'ha_review_manager',
    name: '리뷰매니저',
    description: '이커머스 CS 전문가. 고객 리뷰에 감성적이고 전문적인 답글을 작성합니다.',
    specialties: ['review-reply', 'customer-service', 'cs', 'review-management'],
    avatar: '💬',
    bid_style: 'aggressive',
    api_key: 'am_live_house_review_manager',
  },
];

/**
 * Match house agents to a task based on category and keywords
 */
export function matchAgentsToTask(category: string, title: string, description: string): HouseAgent[] {
  const taskText = `${title} ${description}`.toLowerCase();
  const matched: HouseAgent[] = [];

  for (const agent of HOUSE_AGENTS) {
    // Check if agent specializes in this category
    if (agent.specialties.includes(category)) {
      matched.push(agent);
      continue;
    }

    // Check if any specialties match keywords in task text
    const hasMatchingSpecialty = agent.specialties.some(specialty =>
      taskText.includes(specialty.replace('-', ' ')) || taskText.includes(specialty)
    );

    if (hasMatchingSpecialty) {
      matched.push(agent);
    }
  }

  // If no matches, include general agents (copywriter and researcher)
  if (matched.length === 0) {
    matched.push(
      HOUSE_AGENTS.find(a => a.id === 'ha_copywriter')!,
      HOUSE_AGENTS.find(a => a.id === 'ha_researcher')!
    );
  }

  // Return 1-3 agents, shuffled for variety
  const shuffled = matched.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(3, shuffled.length));
}

/**
 * Calculate bid price based on budget and agent style
 */
export function calculateBidPrice(budget: number, bidStyle: HouseAgent['bid_style']): number {
  let percentage: number;
  
  switch (bidStyle) {
    case 'aggressive':
      percentage = 0.70 + Math.random() * 0.15; // 70-85%
      break;
    case 'moderate':
      percentage = 0.80 + Math.random() * 0.10; // 80-90%
      break;
    case 'conservative':
      percentage = 0.85 + Math.random() * 0.10; // 85-95%
      break;
  }
  
  return Math.floor(budget * percentage);
}

/**
 * Generate estimated time based on task category and agent style
 */
export function generateEstimatedTime(category: string, bidStyle: HouseAgent['bid_style']): string {
  const baseTimesByCategory: Record<string, string[]> = {
    'translation': ['1-2일', '2-3일', '3-4일'],
    'code-review': ['1일', '2일', '1-2일'],
    'content-writing': ['2-3일', '3-5일', '1주일'],
    'copywriting': ['1-2일', '2-3일', '3-5일'],
    'research': ['3-5일', '1주일', '1-2주'],
    'seo': ['2-3일', '1주일', '3-5일'],
    'data-analysis': ['3-5일', '1주일', '2주'],
    'summarization': ['1일', '2일', '1-2일'],
    'product-description': ['1-2일', '2-3일', '3-5일'],
    'product-seo': ['1일', '1-2일', '2-3일'],
    'ad-copy': ['1일', '1-2일', '2-3일'],
    'sns-content': ['1-2일', '2-3일', '3-5일'],
    'review-reply': ['1일', '1일', '1-2일'],
    'default': ['2-3일', '3-5일', '1주일'],
  };

  const times = baseTimesByCategory[category] || baseTimesByCategory['default'];
  
  // Aggressive agents estimate shorter times
  if (bidStyle === 'aggressive') {
    return times[0];
  } else if (bidStyle === 'moderate') {
    return times[Math.floor(Math.random() * 2)]; // 0 or 1
  } else {
    return times[Math.floor(Math.random() * times.length)];
  }
}