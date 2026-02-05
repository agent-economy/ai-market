import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import Mustache from 'mustache';

// Node.js runtime with 60s timeout (Pro plan)
export const maxDuration = 60;

// Disable HTML escaping globally for Mustache
Mustache.escape = (text: string) => text;

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// ─── TYPES ───
interface WizardData {
  industry?: string;
  businessInfo?: {
    name: string;
    phone: string;
    address: string;
    hours: string;
    description: string;
  };
  serviceInfo?: {
    services: string[];
    features: string[];
    specialties: string;
  };
  style?: string;
  color?: string;
  components?: string[];
  // Legacy support
  description?: string;
}

interface MenuItem {
  name: string;
  price: string;
  description: string;
  image: string;
  delay: string;
}

interface GalleryImage {
  image: string;
  title: string;
  tag: string;
  height_class: string;
  delay: string;
}

interface AIContent {
  hero?: {
    tagline?: string;
    description?: string;
    cta_primary?: string;
    cta_secondary?: string;
  };
  about?: {
    badge?: string;
    title?: string;
    tagline?: string;
    content?: string;
    image_url?: string;
  };
  category?: string;
  menu_items?: MenuItem[];
  gallery_images?: GalleryImage[];
  section_badge?: string;
  section_title?: string;
  section_subtitle?: string;
  reviews_data?: Array<{
    name: string;
    role: string;
    content: string;
    rating: number;
  }>;
  stats_rating?: string;
  stats_count?: string;
  stats_satisfaction?: string;
  stats_revisit?: string;
  stats_rating_label?: string;
  stats_count_label?: string;
  stats_satisfaction_label?: string;
  stats_revisit_label?: string;
  contact?: {
    badge?: string;
    title?: string;
  };
  location?: {
    badge?: string;
    title?: string;
    subway?: string;
    parking?: string;
  };
  reservation?: {
    badge?: string;
    title?: string;
    subtitle?: string;
  };
  cta?: {
    title?: string;
    subtitle?: string;
    button?: string;
  };
  footer?: {
    description?: string;
    ceo?: string;
    business_number?: string;
  };
}

// ─── COMPONENT TEMPLATES ───
const COMPONENT_FILES: Record<string, string[]> = {
  hero: ['hero-1.html', 'hero-2.html', 'hero-3.html'],
  about: ['about-1.html', 'about-2.html'],
  menu: ['menu-1.html', 'menu-2.html', 'menu-3.html'],
  gallery: ['gallery-1.html', 'gallery-2.html'],
  reviews: ['reviews-1.html', 'reviews-2.html'],
  contact: ['contact-1.html', 'contact-2.html'],
  location: ['location-1.html', 'location-2.html'],
  reservation: ['reservation-1.html'],
  cta: ['cta-1.html', 'cta-2.html'],
  footer: ['footer-1.html', 'footer-2.html'],
};

// ─── STYLE CONFIGS ───
const STYLE_COLORS: Record<string, { primary: string; gradient: string }> = {
  modern: { primary: 'indigo', gradient: 'from-indigo-600 via-purple-600 to-indigo-800' },
  minimal: { primary: 'slate', gradient: 'from-slate-100 via-white to-slate-50' },
  vivid: { primary: 'rose', gradient: 'from-rose-500 via-pink-500 to-purple-600' },
  warm: { primary: 'amber', gradient: 'from-amber-400 via-orange-400 to-rose-400' },
};

const COLOR_CLASSES: Record<string, string> = {
  indigo: 'indigo',
  rose: 'rose',
  emerald: 'emerald',
  amber: 'amber',
  slate: 'slate',
};

// ─── REVIEW CARD GENERATOR ───
function generateReviewCard(review: { name: string; role: string; content: string; rating: number }, delay: number): string {
  const stars = '⭐'.repeat(Math.min(5, Math.max(1, review.rating)));
  const initial = review.name.charAt(0);
  
  return `
    <div class="group" data-aos="fade-up" data-aos-delay="${delay}">
      <div class="relative h-full p-6 md:p-8 rounded-3xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 shadow-xl shadow-gray-200/50 dark:shadow-none hover:shadow-2xl hover:shadow-purple-500/10 dark:hover:shadow-purple-500/5 transition-all duration-500 hover:-translate-y-2">
        <div class="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 flex items-center justify-center">
          <svg class="w-6 h-6 text-purple-500 dark:text-purple-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
          </svg>
        </div>
        <div class="flex gap-1 mb-4 text-xl">${stars}</div>
        <p class="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-6">"${review.content}"</p>
        <div class="flex items-center gap-4 pt-6 border-t border-gray-200/50 dark:border-white/10">
          <div class="relative">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">${initial}</div>
            <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white dark:border-gray-900 flex items-center justify-center">
              <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </div>
          </div>
          <div class="flex-1">
            <h4 class="font-semibold text-gray-900 dark:text-white">${review.name}</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400">${review.role}</p>
          </div>
        </div>
      </div>
    </div>`;
}

// ─── AI CONTENT GENERATION PROMPT ───
const CONTENT_GENERATION_PROMPT = `You are a Korean copywriter for small business websites. Generate content for a landing page.

RULES:
1. Output ONLY valid JSON - no markdown, no explanations
2. All text must be in Korean (한국어)
3. Be creative and professional
4. Use realistic Korean names for testimonials
5. Generate realistic prices in ₩ format (e.g., ₩15,000)
6. Use placeholder images from https://placehold.co

OUTPUT FORMAT (JSON only):
{
  "hero": {
    "tagline": "짧은 슬로건 (10자 이내)",
    "description": "2-3문장 설명",
    "cta_primary": "예약하기",
    "cta_secondary": "더 알아보기"
  },
  "about": {
    "badge": "소개",
    "title": "섹션 제목",
    "tagline": "한 줄 소개",
    "content": "소개 본문 (3-4문장)",
    "image_url": "https://placehold.co/800x600/3b82f6/ffffff?text=About"
  },
  "category": "대표 메뉴",
  "menu_items": [
    { "name": "메뉴명1", "price": "₩15,000", "description": "맛있는 설명", "image": "https://placehold.co/400x300/f59e0b/ffffff?text=Menu1", "delay": "0" },
    { "name": "메뉴명2", "price": "₩12,000", "description": "설명", "image": "https://placehold.co/400x300/f59e0b/ffffff?text=Menu2", "delay": "100" },
    { "name": "메뉴명3", "price": "₩10,000", "description": "설명", "image": "https://placehold.co/400x300/f59e0b/ffffff?text=Menu3", "delay": "200" },
    { "name": "메뉴명4", "price": "₩8,000", "description": "설명", "image": "https://placehold.co/400x300/f59e0b/ffffff?text=Menu4", "delay": "300" }
  ],
  "gallery_images": [
    { "image": "https://placehold.co/600x400/8b5cf6/ffffff?text=Gallery1", "title": "갤러리 제목1", "tag": "매장", "height_class": "h-64", "delay": "0" },
    { "image": "https://placehold.co/600x500/ec4899/ffffff?text=Gallery2", "title": "갤러리 제목2", "tag": "음식", "height_class": "h-80", "delay": "100" },
    { "image": "https://placehold.co/600x350/06b6d4/ffffff?text=Gallery3", "title": "갤러리 제목3", "tag": "이벤트", "height_class": "h-56", "delay": "200" }
  ],
  "section_badge": "고객 리뷰",
  "section_title": "고객님들의 후기",
  "section_subtitle": "실제 방문 고객 리뷰입니다",
  "reviews_data": [
    { "name": "김민수", "role": "단골 고객", "content": "정말 맛있고 분위기도 좋아요!", "rating": 5 },
    { "name": "이지영", "role": "첫 방문", "content": "서비스가 친절해서 기분 좋았습니다.", "rating": 5 },
    { "name": "박준혁", "role": "재방문 고객", "content": "가성비 최고! 자주 올게요.", "rating": 4 }
  ],
  "stats_rating": "4.9",
  "stats_count": "500+",
  "stats_satisfaction": "98%",
  "stats_revisit": "85%",
  "stats_rating_label": "평균 평점",
  "stats_count_label": "총 리뷰",
  "stats_satisfaction_label": "만족도",
  "stats_revisit_label": "재방문율",
  "contact": {
    "badge": "연락처",
    "title": "문의하기"
  },
  "location": {
    "badge": "오시는 길",
    "title": "위치 안내",
    "subway": "지하철역에서 도보 5분",
    "parking": "건물 내 주차 가능"
  },
  "cta": {
    "title": "지금 바로 방문하세요",
    "subtitle": "특별한 경험이 기다리고 있습니다",
    "button": "예약하기"
  },
  "footer": {
    "description": "간단한 소개 (1문장)",
    "ceo": "대표자명",
    "business_number": "123-45-67890"
  }
}`;

// ─── HELPER FUNCTIONS ───
async function loadComponent(componentType: string, variant: number = 1): Promise<string> {
  const files = COMPONENT_FILES[componentType];
  if (!files || files.length === 0) return '';
  
  const fileIndex = Math.min(variant - 1, files.length - 1);
  const fileName = files[fileIndex];
  
  try {
    const filePath = path.join(process.cwd(), 'src/components/templates', fileName);
    const content = await fs.readFile(filePath, 'utf-8');
    // Remove HTML comments (documentation)
    return content.replace(/<!--[\s\S]*?-->/g, '');
  } catch (error) {
    console.error(`Failed to load component ${fileName}:`, error);
    return '';
  }
}

function fillTemplate(template: string, data: Record<string, unknown>): string {
  try {
    // Use Mustache for template rendering
    const result = Mustache.render(template, data);
    return result;
  } catch (error) {
    console.error('Mustache render error:', error);
    // Fallback: simple string replacement for basic variables
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      }
    }
    return result;
  }
}

function generatePageWrapper(content: string, businessName: string, style: string, color: string): string {
  return `<!DOCTYPE html>
<html lang="ko" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${businessName}</title>
  <meta name="description" content="${businessName} - 공식 웹사이트">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${businessName}">
  <meta property="og:description" content="${businessName} 공식 웹사이트입니다">
  <meta property="og:type" content="website">
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
          },
        },
      },
    }
  </script>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <style>
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
  </style>
  
  <!-- AOS Animation -->
  <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
  <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
  
  <!-- Font Awesome -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  
  <style>
    body { font-family: 'Pretendard', sans-serif; }
    .float { animation: float 6s ease-in-out infinite; }
    .float-delayed { animation: float 6s ease-in-out infinite; animation-delay: 2s; }
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(3deg); }
    }
    /* Smooth scrolling */
    html { scroll-behavior: smooth; }
  </style>
</head>
<body class="bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
  ${content}
  
  <script>
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 50
    });
  </script>
</body>
</html>`;
}

// ─── LEGACY SUPPORT: Full HTML Generation ───
async function generateFullHtml(data: WizardData): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const description = data.description || 
    `${data.businessInfo?.name || '비즈니스'}: ${data.businessInfo?.description || ''}`;

  const stylePrompts: Record<string, string> = {
    modern: 'MODERN LUXURY: Glassmorphism, gradients, floating animations, bold typography, generous whitespace.',
    minimal: 'MINIMAL ELEGANCE: White backgrounds, clean lines, typography-focused, subtle borders.',
    vivid: 'VIVID & BOLD: Strong colors, dynamic gradients, animated elements, energetic feel.',
    warm: 'WARM & FRIENDLY: Soft pastels, rounded corners, friendly icons, approachable.',
  };

  const industryPrompts: Record<string, string> = {
    cafe: 'Include: 시그니처 메뉴 (아메리카노 ₩4,500~), 디저트, 감성 인테리어, WiFi/주차 정보, 포토존',
    restaurant: 'Include: 대표 메뉴 5-7개 with prices, 코스 메뉴, 예약 안내, 주차, 브레이크타임',
    salon: 'Include: 서비스 가격표 (커트 ₩25,000~), 디자이너 소개, Before/After 암시, 예약 CTA',
    fitness: 'Include: PT/프로그램 가격, 시설 안내, 트레이너 소개, 무료 체험 CTA',
    clinic: 'Include: 진료 과목, 원장 프로필, 진료 시간, 예약 전화 크게',
    shop: 'Include: 상품 카테고리, 가격대, 영업시간, 교환/환불 안내',
  };

  const systemPrompt = `You are an elite web designer creating premium Korean business landing pages.
OUTPUT: Complete valid HTML only, starting with <!DOCTYPE html>.
Include: Tailwind CSS, AOS animations, Font Awesome, Pretendard font.
Style: ${stylePrompts[data.style || 'modern'] || stylePrompts.modern}
Color: Use ${data.color || 'indigo'} as primary color.
${data.industry ? industryPrompts[data.industry] || '' : ''}
Create 8+ sections with animations. All Korean content.`;

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create a stunning landing page for: ${description}` },
      ],
      temperature: 0.8,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const result = await response.json();
  let html = result.choices?.[0]?.message?.content || '';
  html = html.replace(/^```html?\s*/i, '').replace(/\s*```$/i, '').trim();
  
  return html;
}

// ─── COMPONENT-BASED GENERATION ───
async function generateWithComponents(data: WizardData): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const selectedComponents = data.components || ['hero', 'about', 'menu', 'reviews', 'contact', 'location'];
  const businessInfo = data.businessInfo || { name: '비즈니스', phone: '', address: '', hours: '', description: '' };
  const serviceInfo = data.serviceInfo || { services: [], features: [], specialties: '' };

  // Generate content with AI
  const contentPrompt = `Generate website content for this Korean business:

Business: ${businessInfo.name}
Industry: ${data.industry || 'general'}
Description: ${businessInfo.description}
Phone: ${businessInfo.phone || '02-1234-5678'}
Address: ${businessInfo.address || '서울시 강남구'}
Hours: ${businessInfo.hours || '오전 10:00 - 오후 10:00'}
Services: ${serviceInfo.services.join(', ') || '다양한 서비스'}
Features: ${serviceInfo.features.join(', ') || ''}
Specialty: ${serviceInfo.specialties || ''}

Selected sections: ${selectedComponents.join(', ')}

${CONTENT_GENERATION_PROMPT}`;

  console.log('[generate] Calling AI for content generation...');
  
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: contentPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    console.error('[generate] AI API failed, status:', response.status);
    throw new Error('AI content generation failed');
  }

  const result = await response.json();
  const rawContent = result.choices?.[0]?.message?.content || '{}';
  
  console.log('[generate] AI response received, length:', rawContent.length);

  let contentJson: AIContent;
  try {
    contentJson = JSON.parse(rawContent);
    console.log('[generate] JSON parsed successfully, keys:', Object.keys(contentJson));
  } catch (parseError) {
    console.error('[generate] JSON parse failed:', parseError);
    throw new Error('Failed to parse AI content');
  }

  // Build reviews HTML from reviews_data array
  let reviewsHtml = '';
  if (contentJson.reviews_data && Array.isArray(contentJson.reviews_data)) {
    reviewsHtml = contentJson.reviews_data
      .map((review, index) => generateReviewCard(review, index * 100))
      .join('\n');
    console.log('[generate] Generated', contentJson.reviews_data.length, 'review cards');
  }

  // Prepare template data - merge business info with AI-generated content
  const templateData: Record<string, unknown> = {
    // Business info (always present)
    business_name: businessInfo.name,
    phone: businessInfo.phone || '02-1234-5678',
    address: businessInfo.address || '서울시',
    hours: businessInfo.hours || '10:00 - 22:00',
    description: businessInfo.description || `${businessInfo.name}에 오신 것을 환영합니다.`,
    
    // Hero defaults
    tagline: contentJson.hero?.tagline || '최고의 서비스',
    hero_description: contentJson.hero?.description || businessInfo.description,
    cta_primary: contentJson.hero?.cta_primary || '예약하기',
    cta_secondary: contentJson.hero?.cta_secondary || '더 알아보기',
    
    // About section
    image_url: contentJson.about?.image_url || 'https://placehold.co/800x600/6366f1/ffffff?text=About+Us',
    about_badge: contentJson.about?.badge || '소개',
    about_tagline: contentJson.about?.tagline || '당신을 위한 공간',
    about_content: contentJson.about?.content || businessInfo.description,
    
    // Menu section
    category: contentJson.category || '메뉴',
    menu_items: contentJson.menu_items || [],
    
    // Gallery section
    gallery_images: contentJson.gallery_images || [],
    
    // Reviews section - use pre-rendered HTML
    section_badge: contentJson.section_badge || '고객 리뷰',
    section_title: contentJson.section_title || '고객님들의 후기',
    section_subtitle: contentJson.section_subtitle || '실제 방문 고객들의 생생한 후기입니다',
    reviews: reviewsHtml, // Pre-rendered HTML
    stats_rating: contentJson.stats_rating || '4.9',
    stats_count: contentJson.stats_count || '500+',
    stats_satisfaction: contentJson.stats_satisfaction || '98%',
    stats_revisit: contentJson.stats_revisit || '85%',
    stats_rating_label: contentJson.stats_rating_label || '평균 평점',
    stats_count_label: contentJson.stats_count_label || '총 리뷰',
    stats_satisfaction_label: contentJson.stats_satisfaction_label || '만족도',
    stats_revisit_label: contentJson.stats_revisit_label || '재방문율',
    
    // Contact section
    contact_badge: contentJson.contact?.badge || '연락처',
    contact_title: contentJson.contact?.title || '문의하기',
    
    // Location section
    location_badge: contentJson.location?.badge || '오시는 길',
    location_title: contentJson.location?.title || '위치 안내',
    location_subway: contentJson.location?.subway || '',
    location_parking: contentJson.location?.parking || '',
    
    // CTA section
    cta_title: contentJson.cta?.title || '지금 바로 방문하세요',
    cta_subtitle: contentJson.cta?.subtitle || '특별한 경험이 기다리고 있습니다',
    cta_button: contentJson.cta?.button || '예약하기',
    cta_text: contentJson.cta?.button || '예약하기',
    
    // Footer section
    footer_description: contentJson.footer?.description || businessInfo.description,
    ceo: contentJson.footer?.ceo || '대표자명',
    business_number: contentJson.footer?.business_number || '000-00-00000',
    
    // SNS links (defaults)
    sns_links: {
      instagram: '#',
      kakao: '#',
      naver: '#',
    },
  };

  console.log('[generate] Template data prepared, loading components...');

  // Variant selection based on style
  const styleVariants: Record<string, Record<string, number>> = {
    modern: { hero: 1, about: 1, menu: 1, reviews: 1, contact: 1, footer: 1 },
    minimal: { hero: 2, about: 2, menu: 2, reviews: 2, contact: 2, footer: 2 },
    vivid: { hero: 3, about: 1, menu: 3, reviews: 1, contact: 1, footer: 1 },
    warm: { hero: 1, about: 2, menu: 2, reviews: 2, contact: 2, footer: 2 },
  };
  
  const selectedStyle = data.style || 'modern';
  const variantMap = styleVariants[selectedStyle] || styleVariants.modern;

  // Load and combine components
  const componentHtmlParts: string[] = [];
  
  for (const comp of selectedComponents) {
    const variant = variantMap[comp] || 1;
    const template = await loadComponent(comp, variant);
    if (template) {
      console.log(`[generate] Filling template: ${comp} (variant ${variant})`);
      const filledTemplate = fillTemplate(template, templateData);
      componentHtmlParts.push(filledTemplate);
    }
  }

  // Always add footer
  if (!selectedComponents.includes('footer')) {
    const footerVariant = variantMap['footer'] || 1;
    const footerTemplate = await loadComponent('footer', footerVariant);
    if (footerTemplate) {
      const filledFooter = fillTemplate(footerTemplate, templateData);
      componentHtmlParts.push(filledFooter);
    }
  }

  const combinedContent = componentHtmlParts.join('\n\n');
  
  console.log('[generate] All components combined, total length:', combinedContent.length);
  
  return generatePageWrapper(
    combinedContent,
    businessInfo.name,
    data.style || 'modern',
    data.color || 'indigo'
  );
}

// ─── MAIN HANDLER ───
export async function POST(request: NextRequest) {
  try {
    const data: WizardData = await request.json();

    console.log('[generate] Request received:', {
      hasComponents: !!data.components,
      componentCount: data.components?.length,
      businessName: data.businessInfo?.name,
      industry: data.industry,
    });

    // Validate input
    if (!data.description && !data.businessInfo?.name) {
      return NextResponse.json(
        { error: '비즈니스 정보를 입력해주세요.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API 설정 오류입니다. 관리자에게 문의하세요.' },
        { status: 500 }
      );
    }

    let html: string;

    // Use component-based generation if wizard data is provided
    if (data.components && data.components.length > 0 && data.businessInfo) {
      console.log('[generate] Using component-based generation');
      try {
        html = await generateWithComponents(data);
      } catch (error) {
        console.error('[generate] Component generation failed:', error);
        console.log('[generate] Falling back to full HTML generation');
        html = await generateFullHtml(data);
      }
    } else {
      // Legacy: generate full HTML
      console.log('[generate] Using legacy full HTML generation');
      html = await generateFullHtml(data);
    }

    // Validate output
    if (!html.includes('<html') && !html.includes('<!DOCTYPE') && !html.includes('<body')) {
      return NextResponse.json(
        { error: 'AI가 올바른 HTML을 생성하지 못했습니다. 다시 시도해주세요.' },
        { status: 502 }
      );
    }

    console.log('[generate] Success, HTML length:', html.length);

    return NextResponse.json({ html });
  } catch (error) {
    console.error('[generate] Error:', error);
    return NextResponse.json(
      { error: `서버 오류: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
