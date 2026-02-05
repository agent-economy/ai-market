import { NextRequest, NextResponse } from 'next/server';

// Edge runtime = 30s timeout on Hobby (vs 10s for serverless)
export const runtime = 'edge';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `한국어 랜딩페이지 HTML 생성. Tailwind CSS CDN 사용. 
섹션: 네비게이션, 히어로(CTA버튼), 서비스소개(3개), 연락처, 푸터.
Unsplash 이미지 사용. 반응형. 코드만 출력, 설명 없이. <!DOCTYPE html>로 시작.`;

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

    const apiKey = process.env.OPENAI_API_KEY;
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

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      return NextResponse.json(
        { error: `AI 생성 실패: ${response.status}` },
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
