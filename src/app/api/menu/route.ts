import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are an elite Korean menu designer who creates stunning digital menus for restaurants, cafes, and bars. Your menus increase average order value by 25%+.

## OUTPUT FORMAT
Return valid HTML starting with <!DOCTYPE html>. Create a beautiful, mobile-first digital menu.

## TECH STACK (include in <head>)
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

## MENU STRUCTURE

### 1. HEADER
- Restaurant name (large, stylish)
- Tagline or concept
- Logo area (emoji or icon)
- Operating hours hint

### 2. CATEGORY TABS (sticky)
<div class="sticky top-0 bg-white/90 backdrop-blur-lg z-10 flex overflow-x-auto gap-2 p-4 border-b">
  <button class="px-4 py-2 bg-black text-white rounded-full text-sm font-medium whitespace-nowrap">추천</button>
  <button class="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium whitespace-nowrap">메인</button>
  ...
</div>

### 3. FEATURED/RECOMMENDED SECTION
- "사장님 추천" or "BEST" badge
- Large image cards for signature items
- Each card:
<div class="relative rounded-2xl overflow-hidden shadow-lg">
  <img src="https://picsum.photos/400/300?random=1" class="w-full h-48 object-cover">
  <div class="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">BEST</div>
  <div class="p-4">
    <h3 class="font-bold text-lg">메뉴명</h3>
    <p class="text-gray-500 text-sm mt-1">설명</p>
    <p class="text-lg font-black mt-2">₩15,000</p>
  </div>
</div>

### 4. MENU CATEGORIES
For each category:
<section class="py-6">
  <h2 class="text-xl font-black mb-4 flex items-center gap-2">
    <span>🍖</span> 메인 요리
  </h2>
  <div class="space-y-4">
    <!-- Menu items -->
  </div>
</section>

### 5. MENU ITEM STYLES

#### Style A: With Image (signature items)
<div class="flex gap-4 p-4 bg-gray-50 rounded-2xl">
  <img src="https://picsum.photos/100/100?random=N" class="w-24 h-24 rounded-xl object-cover flex-shrink-0">
  <div class="flex-1">
    <div class="flex items-start justify-between">
      <div>
        <h3 class="font-bold">메뉴명</h3>
        <p class="text-gray-500 text-sm mt-1">재료나 간단한 설명</p>
      </div>
      <span class="font-black">₩12,000</span>
    </div>
    <div class="flex gap-1 mt-2">
      <span class="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">매운맛</span>
      <span class="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">인기</span>
    </div>
  </div>
</div>

#### Style B: Compact (regular items)
<div class="flex justify-between items-start py-3 border-b border-gray-100">
  <div>
    <h3 class="font-medium">메뉴명</h3>
    <p class="text-gray-400 text-sm">설명</p>
  </div>
  <span class="font-bold whitespace-nowrap">₩8,000</span>
</div>

### 6. SPECIAL TAGS
- 🌶️ 매운맛 (Spicy)
- 🥬 채식 (Vegetarian)  
- ⭐ 인기 (Popular)
- 🆕 신메뉴 (New)
- 👨‍🍳 추천 (Chef's pick)
- 🔥 베스트 (Best seller)

### 7. SET MENU / COMBO SECTION
- Highlighted with different background
- Shows savings: "단품보다 ₩5,000 저렴"
- Includes what's in the set

### 8. DRINKS SECTION
- Separate section with icons
- Alcohol 주류, Non-alcohol 음료, Coffee 커피

### 9. FOOTER INFO
- 알레르기 정보 안내
- 가격은 부가세 포함
- 원산지 표시 (한우, 국내산 등)

## PRICING PSYCHOLOGY
- Use ₩ symbol always
- Anchor pricing: show expensive items first
- Bundle deals prominently displayed
- "1인분", "2인분" sizing options

## DESIGN BY BUSINESS TYPE

### Cafe (카페)
- Warm, cozy colors (browns, creams)
- Coffee-themed icons
- Instagram-worthy aesthetic

### Korean Restaurant (한식당)
- Traditional yet modern
- Korean motifs subtly
- Warm, inviting colors

### Western/Italian (양식)
- Clean, minimal
- Elegant typography
- Muted color palette

### Bar/Pub (술집)
- Dark theme option
- Moody, atmospheric
- Neon accent colors

### Bakery (베이커리)
- Soft, pastel colors
- Playful, sweet aesthetic
- Cake/bread icons

## MOBILE OPTIMIZATION
- max-w-lg mx-auto
- Touch-friendly tap targets
- Smooth scrolling
- Sticky category navigation

Generate a BEAUTIFUL, APPETIZING menu that makes people want to order everything.`;

const STYLE_PROMPTS: Record<string, string> = {
  modern: 'Clean modern design with white background, subtle shadows, and accent colors',
  traditional: 'Traditional Korean aesthetic with warm colors and subtle patterns',
  minimal: 'Ultra minimal with lots of whitespace, black text, simple layout',
  luxury: 'Premium luxury feel with dark backgrounds, gold accents, elegant fonts',
  cute: 'Playful and cute with pastel colors, rounded shapes, fun illustrations',
  dark: 'Dark mode with black/gray backgrounds, perfect for bars and night venues',
};

export async function POST(request: NextRequest) {
  try {
    const { 
      businessName,
      businessType = 'restaurant',
      description,
      menuItems = [],
      style = 'modern',
      color = 'neutral'
    } = await request.json();

    if (!businessName) {
      return NextResponse.json(
        { error: '가게 이름을 입력해주세요.' },
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

    const styleDesc = STYLE_PROMPTS[style] || STYLE_PROMPTS.modern;
    
    const menuContext = menuItems.length > 0 
      ? `\n## ACTUAL MENU ITEMS\n${menuItems.map((item: {name: string; price: number; desc?: string; category?: string}) => 
          `- ${item.name}: ₩${item.price?.toLocaleString()} ${item.desc ? `(${item.desc})` : ''} ${item.category ? `[${item.category}]` : ''}`
        ).join('\n')}`
      : '\n## GENERATE REALISTIC MENU\nCreate 15-25 realistic menu items appropriate for this business type with authentic Korean names and prices.';

    const userPrompt = `Create a stunning digital menu:

## BUSINESS INFO
- Name: ${businessName}
- Type: ${businessType}
${description ? `- Concept: ${description}` : ''}

## DESIGN
${styleDesc}
- Accent color: ${color}
${menuContext}

## REQUIREMENTS
1. Include ALL sections from system prompt
2. Mobile-first design (max-w-lg mx-auto)
3. Sticky category tabs
4. Mix of image cards (for signatures) and compact list (for regular items)
5. Add appropriate tags (인기, 매운맛, etc.)
6. Include set menu/combo deals
7. Korean restaurant standards (원산지, 알레르기 등)
8. Make it appetizing!

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
        temperature: 0.8,
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

    html = html.replace(/^```html?\s*/i, '').replace(/\s*```$/i, '').trim();

    if (!html.includes('<html') && !html.includes('<!DOCTYPE')) {
      return NextResponse.json(
        { error: 'AI가 올바른 HTML을 생성하지 못했습니다.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ html });
  } catch (error) {
    console.error('Menu API error:', error);
    return NextResponse.json(
      { error: `서버 오류: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
