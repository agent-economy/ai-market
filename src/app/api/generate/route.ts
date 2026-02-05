import { NextRequest, NextResponse } from 'next/server';

// Edge runtime = 30s timeout on Hobby (vs 10s for serverless)
export const runtime = 'edge';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `당신은 세계적 수준의 웹 디자이너 겸 프론트엔드 개발자입니다.
사용자의 비즈니스 설명을 듣고, 완성도 높은 한국어 랜딩페이지를 HTML로 생성합니다.

필수 규칙:
- Tailwind CSS CDN: <script src="https://cdn.tailwindcss.com"></script>
- 완전한 단일 HTML 파일 (<!DOCTYPE html> 부터 </html> 까지)
- 한국어 콘텐츠 (자연스럽고 설득력 있는 마케팅 문구)
- 반응형 디자인 (모바일 우선)
- Inter + Noto Sans KR 폰트 (Google Fonts CDN)

필수 섹션 (순서대로):
1. 네비게이션 바 (로고 + 메뉴)
2. 히어로 섹션 (큰 제목 + 설명 + CTA 버튼 + 배경 이미지/그라디언트)
3. 서비스/메뉴 소개 (카드 그리드, 3-4개)
4. 왜 우리인가 / 특징 (아이콘 + 텍스트, 3-4개)
5. 고객 후기 (카드형, 2-3개, 별점 포함)
6. 연락처 / 위치 / 예약 (전화번호, 주소, 영업시간)
7. 푸터 (저작권, SNS 링크)

디자인 규칙:
- 이미지: https://images.unsplash.com/photo-{적절한ID}?w=800&h=600&fit=crop 형태로 Unsplash 이미지 활용
  - 히어로 배경, 서비스 카드에 비즈니스와 관련된 실제 사진 사용
  - 사진 ID 예시: 커피/카페=1495474472287-4d71bcdd2085, 네일=1604654894610-df63bc536371, 음식=1504674900247-0877df9cc836, 헬스=1534438327276-14e5300c3a48, 꽃=1490750967868-88aa4f44baee, 사무실=1497366216548-37526070297c, 뷰티=1522337360788-8b13dee7a37e
- 이모지 적절히 활용 (과하지 않게)
- smooth scroll 동작
- hover 효과 (scale, shadow, color transition)
- 그라디언트, rounded-2xl, shadow-xl 적극 활용

출력 규칙:
- HTML 코드만 출력 (설명 텍스트 절대 포함하지 마세요)
- 코드블록 마커(\`\`\`html, \`\`\`) 절대 포함하지 마세요
- <!DOCTYPE html>로 시작해서 </html>로 끝나야 합니다`;

const STYLE_PROMPTS: Record<string, string> = {
  modern: '모던하고 트렌디한 디자인. 그라디언트 배경, 글래스모피즘 효과, 큰 타이포그래피, 넉넉한 여백.',
  minimal: '미니멀하고 깔끔한 디자인. 흰색 기반, 최소한의 컬러, 깔끔한 라인, 넓은 여백, 타이포그래피 중심.',
  vivid: '화려하고 눈길을 끄는 디자인. 볼드한 컬러, 큰 이미지 영역, 애니메이션 효과, 다이나믹한 레이아웃.',
  warm: '따뜻하고 친근한 디자인. 부드러운 색감, 라운드된 모서리, 아이콘 활용, 손글씨 느낌의 포인트.',
};

const COLOR_PROMPTS: Record<string, string> = {
  indigo: '인디고/보라색 계열 (indigo-500, indigo-600, violet-500). 신뢰감과 전문성.',
  rose: '로즈/핑크 계열 (rose-500, pink-500, rose-400). 세련되고 감성적인 느낌.',
  emerald: '에메랄드/그린 계열 (emerald-500, teal-500, green-500). 자연스럽고 건강한 느낌.',
  amber: '앰버/오렌지 계열 (amber-500, orange-500, yellow-500). 따뜻하고 활기찬 느낌.',
  slate: '슬레이트/모노톤 계열 (slate-700, gray-800, slate-500). 세련되고 모던한 느낌.',
};

export async function POST(request: NextRequest) {
  try {
    const { description, style = 'modern', color = 'indigo' } = await request.json();

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: '비즈니스 설명을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (description.length > 2000) {
      return NextResponse.json(
        { error: '설명은 2000자 이내로 작성해주세요.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API 설정 오류입니다. 관리자에게 문의하세요.' },
        { status: 500 }
      );
    }

    const styleDesc = STYLE_PROMPTS[style] || STYLE_PROMPTS.modern;
    const colorDesc = COLOR_PROMPTS[color] || COLOR_PROMPTS.indigo;

    const userPrompt = `비즈니스 설명: ${description}

디자인 스타일: ${styleDesc}
컬러 테마: ${colorDesc}

위 비즈니스에 맞는 완성도 높은 랜딩페이지 HTML을 생성해주세요.`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API error:', response.status, errorData);
      return NextResponse.json(
        { error: `AI 생성 실패: ${response.status} - ${errorData.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    let html = data.choices?.[0]?.message?.content || '';

    // Clean up any code block markers
    html = html.replace(/^```html?\s*/i, '').replace(/\s*```$/i, '').trim();

    // Validate it looks like HTML
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
