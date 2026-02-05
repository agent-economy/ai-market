import { NextRequest, NextResponse } from 'next/server';

// Node.js runtime with 60s timeout (Pro plan)
export const maxDuration = 60;

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `당신은 세계 최고의 웹 디자이너입니다. 한국 소상공인을 위한 프리미엄 랜딩페이지를 만듭니다.

## 필수 기술 스택
- Tailwind CSS (CDN)
- Google Fonts: Noto Sans KR (본문), Pretendard 또는 Suite (제목)
- Font Awesome 6 아이콘
- 모바일 퍼스트 반응형

## 필수 섹션 (7개)
1. **네비게이션**: sticky, 로고+메뉴+CTA버튼, 모바일 햄버거
2. **히어로**: 풀스크린, 임팩트 있는 헤드라인, 서브카피, CTA 버튼 2개, 배경 이미지/그라데이션
3. **특징/장점**: 3~4개 카드, 아이콘+제목+설명, 그리드 레이아웃
4. **서비스/메뉴**: 가격표 또는 메뉴판, 깔끔한 테이블 또는 카드
5. **후기/신뢰**: 고객 후기 2~3개 또는 수상/인증 배지
6. **CTA 섹션**: 강렬한 배경색, 액션 유도 문구, 큰 버튼
7. **푸터**: 연락처, 영업시간, 지도 링크, SNS 아이콘, 저작권

## 디자인 원칙
- 여백: py-20 이상, 섹션 간 충분한 간격
- 컨테이너: max-w-6xl mx-auto px-4
- 그림자: shadow-xl, shadow-2xl 적극 활용
- 모서리: rounded-2xl, rounded-3xl
- 호버: hover:scale-105, hover:shadow-2xl transition-all duration-300
- 그라데이션: from-{color}-500 to-{color}-700
- 글래스모피즘: backdrop-blur-lg bg-white/80

## 이미지
- Unsplash: https://images.unsplash.com/photo-{id}?w=800&h=600&fit=crop
- 또는: https://source.unsplash.com/800x600/?{keyword}
- 업종에 맞는 키워드 사용

## 한국 로컬라이징
- 전화번호: 010-XXXX-XXXX 형식
- 영업시간: 오전 10:00 - 오후 9:00 형식
- 가격: ₩15,000 형식 (원화 기호)
- 주소: 서울시 강남구 형식

## 출력 규칙
- <!DOCTYPE html>로 시작
- 완전한 HTML 문서
- 주석 없이 코드만
- 설명 텍스트 없이 HTML만`;

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

    const userPrompt = `## 비즈니스 정보
${description}

## 디자인 스타일
${styleDesc}

## 컬러 테마
${colorDesc}

위 정보를 바탕으로 프리미엄 랜딩페이지 HTML을 생성하세요.
- 7개 섹션 모두 포함
- 풍부한 콘텐츠 (실제 운영되는 느낌)
- 세련된 디자인
- 모바일 완벽 대응`;

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
        max_tokens: 6000,
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
