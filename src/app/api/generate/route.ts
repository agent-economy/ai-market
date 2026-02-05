import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Node.js runtime with 60s timeout (Pro plan)
export const maxDuration = 60;

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

// ─── COMPONENT TEMPLATES ───
const COMPONENT_FILES: Record<string, string[]> = {
  hero: ['hero-1.html', 'hero-2.html', 'hero-3.html'],
  about: ['about-1.html', 'about-2.html'],
  menu: ['menu-1.html', 'menu-2.html', 'menu-3.html'],
  gallery: ['gallery-1.html', 'gallery-2.html'],
  reviews: ['reviews-1.html', 'reviews-2.html'],
  contact: ['contact-1.html', 'contact-2.html'],
  location: ['location-1.html', 'location-2.html'],
  reservation: ['reservation-1.html'], // 예약 위젯
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

// ─── AI CONTENT GENERATION PROMPT ───
const CONTENT_GENERATION_PROMPT = `You are a Korean copywriter for small business websites. Generate content for a landing page.

RULES:
1. Output ONLY valid JSON - no markdown, no explanations
2. All text must be in Korean (한국어)
3. Be creative and professional
4. Use realistic Korean names for testimonials
5. Generate realistic prices in ₩ format

OUTPUT FORMAT (JSON only):
{
  "hero": {
    "tagline": "짧은 슬로건 (10자 이내)",
    "headline_prefix": "수식어",
    "headline_suffix": "부제목",
    "description": "2-3문장 설명",
    "cta_primary": "예약하기",
    "cta_secondary": "더 알아보기",
    "stats": [
      { "value": "2,500+", "label": "만족 고객" },
      { "value": "4.9", "label": "평점" },
      { "value": "5년", "label": "운영 경력" }
    ]
  },
  "about": {
    "badge": "소개",
    "title": "섹션 제목",
    "subtitle": "부제목",
    "content": "소개 본문 (3-4문장)",
    "features": ["특징1", "특징2", "특징3", "특징4"]
  },
  "menu": {
    "badge": "메뉴",
    "title": "섹션 제목",
    "items": [
      { "name": "메뉴명", "price": "₩15,000", "description": "설명", "popular": true },
      { "name": "메뉴명", "price": "₩12,000", "description": "설명", "popular": false }
    ]
  },
  "reviews": {
    "badge": "고객 리뷰",
    "title": "고객님들의 후기",
    "subtitle": "실제 방문 고객 리뷰",
    "items": [
      { "name": "김민수", "role": "단골 고객", "rating": 5, "text": "리뷰 내용", "date": "2024.01.15" },
      { "name": "이서연", "role": "신규 고객", "rating": 5, "text": "리뷰 내용", "date": "2024.01.20" }
    ],
    "stats": {
      "rating": "4.9",
      "count": "2,847",
      "satisfaction": "98%",
      "revisit": "93%"
    }
  },
  "contact": {
    "badge": "연락처",
    "title": "문의하기",
    "phone": "02-1234-5678",
    "email": "info@example.com",
    "kakao": "@상호명"
  },
  "location": {
    "badge": "오시는 길",
    "title": "위치 안내",
    "address": "주소",
    "subway": "지하철역에서 도보 5분",
    "parking": "건물 내 주차 가능",
    "hours": "영업시간"
  },
  "cta": {
    "title": "지금 바로 방문하세요",
    "subtitle": "특별한 경험이 기다리고 있습니다",
    "button": "예약하기",
    "phone": "02-1234-5678"
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
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    console.error(`Failed to load component ${fileName}:`, error);
    return '';
  }
}

function fillTemplate(template: string, data: Record<string, any>, prefix: string = ''): string {
  let result = template;
  
  for (const [key, value] of Object.entries(data)) {
    const placeholder = prefix ? `{{${prefix}_${key}}}` : `{{${key}}}`;
    
    if (typeof value === 'string') {
      result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Recursively handle nested objects
      result = fillTemplate(result, value, key);
    }
  }
  
  return result;
}

function generatePageWrapper(content: string, businessName: string, style: string, color: string): string {
  const colorClass = COLOR_CLASSES[color] || 'indigo';
  
  return `<!DOCTYPE html>
<html lang="ko" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${businessName}</title>
  <meta name="description" content="${businessName} - 공식 웹사이트">
  
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
    console.error('Content generation failed, falling back to full HTML');
    return generateFullHtml(data);
  }

  const result = await response.json();
  let contentJson;
  
  try {
    contentJson = JSON.parse(result.choices?.[0]?.message?.content || '{}');
  } catch {
    console.error('Failed to parse AI content, falling back to full HTML');
    return generateFullHtml(data);
  }

  // Load and combine components
  const componentHtmlParts: string[] = [];
  
  for (const comp of selectedComponents) {
    const template = await loadComponent(comp, 1);
    if (template) {
      const filledTemplate = fillTemplate(template, {
        business_name: businessInfo.name,
        phone: businessInfo.phone || '02-1234-5678',
        address: businessInfo.address,
        hours: businessInfo.hours,
        description: businessInfo.description,
        ...contentJson[comp],
      });
      componentHtmlParts.push(filledTemplate);
    }
  }

  // Always add footer
  const footerTemplate = await loadComponent('footer', 1);
  if (footerTemplate) {
    const filledFooter = fillTemplate(footerTemplate, {
      business_name: businessInfo.name,
      phone: businessInfo.phone || '02-1234-5678',
      address: businessInfo.address,
      ...contentJson.footer,
    });
    componentHtmlParts.push(filledFooter);
  }

  const combinedContent = componentHtmlParts.join('\n\n');
  
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
      try {
        html = await generateWithComponents(data);
      } catch (error) {
        console.error('Component generation failed, trying full HTML:', error);
        html = await generateFullHtml(data);
      }
    } else {
      // Legacy: generate full HTML
      html = await generateFullHtml(data);
    }

    // Validate output
    if (!html.includes('<html') && !html.includes('<!DOCTYPE') && !html.includes('<body')) {
      return NextResponse.json(
        { error: 'AI가 올바른 HTML을 생성하지 못했습니다. 다시 시도해주세요.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ html });
  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json(
      { error: `서버 오류: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
