import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are an elite Korean e-commerce copywriter who creates product detail pages that convert at 15%+. Your pages are used by top brands on Coupang, Naver SmartStore, and 29CM.

## OUTPUT FORMAT
Return valid HTML starting with <!DOCTYPE html>. Create a complete, mobile-first product detail page.

## TECH STACK (include in <head>)
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
<link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">

## PAGE STRUCTURE (Korean 상세페이지 style)

### 1. HERO PRODUCT SECTION
- Large product image: https://picsum.photos/800/800?random=1
- Product name (large, bold)
- Price with discount: <span class="line-through text-gray-400">₩89,000</span> <span class="text-red-500 font-black text-3xl">₩59,000</span>
- Discount badge: <span class="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">33% OFF</span>
- Star rating + review count
- Key benefits (3-4 bullet points with icons)

### 2. TRUST BADGES
- 무료배송, 오늘출발, 100% 정품, 교환/환불 가능
- Use icons: <i class="fas fa-truck"></i>, <i class="fas fa-shield-alt"></i>

### 3. PRODUCT HIGHLIGHTS (카드 섹션)
- 3-4 key features in card grid
- Each card: icon + title + short description
- Use: bg-gray-50 rounded-2xl p-6

### 4. DETAILED DESCRIPTION (긴 설명)
- Problem → Solution format
- Before/After implications
- Use case scenarios
- Lifestyle images: https://picsum.photos/600/400?random=N

### 5. SPECIFICATIONS (스펙 테이블)
<table class="w-full">
  <tr class="border-b"><td class="py-3 text-gray-500">사이즈</td><td class="py-3 font-medium">...</td></tr>
</table>

### 6. SOCIAL PROOF
- Customer reviews (3-5 reviews)
- Photo reviews if applicable
- Star ratings
- "구매자 NN% 만족" badge

### 7. FAQ SECTION
- 5-7 common questions
- Accordion style with + icons

### 8. PURCHASE CTA (sticky bottom on mobile)
<div class="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3">
  <button class="flex-1 py-4 bg-gray-100 rounded-xl font-bold">장바구니</button>
  <button class="flex-2 py-4 bg-black text-white rounded-xl font-bold">바로구매</button>
</div>

### 9. RELATED PRODUCTS
- 4 product cards in horizontal scroll

## KOREAN E-COMMERCE COPY PATTERNS
- Urgency: "오늘만 특가", "한정 수량", "마감 임박"
- Social proof: "누적 판매 10만개", "리뷰 4.9점"
- Benefits over features: "피부가 촉촉해져요" not "히알루론산 함유"
- Emotional triggers: "선물하기 좋은", "엄마도 만족한"
- Trust: "국내 생산", "정품 인증", "무료 AS"

## DESIGN STYLE
- Clean white background
- Accent color from product
- Generous whitespace
- Large, clear images
- Easy-to-scan layout
- Mobile-optimized (max-w-lg mx-auto)

## IMAGE RULES
- Product images: https://picsum.photos/800/800?random=N
- Lifestyle images: https://picsum.photos/600/400?random=N
- NO source.unsplash.com

Generate a COMPLETE, CONVERSION-OPTIMIZED product page.`;

export async function POST(request: NextRequest) {
  try {
    const { 
      productName,
      description,
      price,
      originalPrice,
      category = 'general',
      features = [],
      style = 'modern'
    } = await request.json();

    if (!productName || !description) {
      return NextResponse.json(
        { error: '상품명과 설명을 입력해주세요.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API 설정 오류입니다.' },
        { status: 500 }
      );
    }

    const userPrompt = `Create a high-converting Korean product detail page:

## PRODUCT INFO
- Name: ${productName}
- Description: ${description}
- Price: ₩${price?.toLocaleString() || '39,000'}
${originalPrice ? `- Original Price: ₩${originalPrice.toLocaleString()} (할인 표시)` : ''}
- Category: ${category}
${features.length > 0 ? `- Key Features: ${features.join(', ')}` : ''}

## STYLE
${style === 'luxury' ? 'Premium luxury feel - black/gold accents, elegant typography' :
  style === 'cute' ? 'Cute and playful - pastel colors, rounded shapes, fun icons' :
  style === 'minimal' ? 'Minimal and clean - lots of whitespace, subtle colors' :
  'Modern and professional - clean lines, trust-building'}

## REQUIREMENTS
1. Include ALL sections from system prompt
2. Make it mobile-first (max-w-lg mx-auto)
3. Add realistic Korean reviews with names
4. Include sticky purchase CTA at bottom
5. Use AOS animations on scroll
6. Generate realistic specs based on product type
7. Add urgency elements (limited time, stock count)

OUTPUT: Complete HTML only, starting with <!DOCTYPE html>`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return NextResponse.json(
        { error: `AI 생성 실패: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    let html = data.choices?.[0]?.message?.content || '';

    // Clean up code blocks
    html = html.replace(/^```html?\s*/i, '').replace(/\s*```$/i, '').trim();

    if (!html.includes('<html') && !html.includes('<!DOCTYPE')) {
      return NextResponse.json(
        { error: 'AI가 올바른 HTML을 생성하지 못했습니다.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ html });
  } catch (error) {
    console.error('Product page API error:', error);
    return NextResponse.json(
      { error: `서버 오류: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
