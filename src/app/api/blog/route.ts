import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are an elite Korean SEO content writer who creates viral blog posts that rank #1 on Naver and Google. Your posts get 10,000+ views and drive real business results.

## OUTPUT FORMAT
Return a JSON object with this exact structure:
{
  "title": "SEO-optimized title with keyword",
  "subtitle": "Compelling subtitle/hook",
  "content": "Full markdown content",
  "meta_description": "155 character SEO description",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "estimated_read_time": "5분"
}

## CONTENT RULES

### Title (제목)
- 30-50 characters for Naver optimization
- Include primary keyword naturally
- Use numbers when relevant: "5가지", "TOP 10", "2026년"
- Emotional hooks: "꼭 알아야 할", "완벽 가이드", "솔직 후기"

### Structure (구조)
1. **Hook intro** (2-3 sentences) - grab attention immediately
2. **Table of contents** (목차) - for long posts
3. **Main content** with H2/H3 headers
4. **Practical tips** or actionable advice
5. **Conclusion** with CTA

### Writing Style
- Conversational but professional (존댓말)
- Short paragraphs (2-3 sentences max)
- Use bullet points and numbered lists
- Include relevant emojis sparingly 📌 ✅ 💡
- Add "꿀팁" (honey tip) boxes for key insights
- Personal touches: "제가 직접 경험해보니..."

### SEO Optimization
- Primary keyword in first 100 words
- Use related keywords naturally throughout
- Include location keywords if relevant (서울, 강남, etc.)
- Add FAQ section at the end (Q&A format)
- Internal linking suggestions: [관련 글 보기]

### Naver-specific
- 2,000-3,500 characters optimal
- Include "정보성" markers
- Add 출처/참고 section if citing facts
- Mobile-friendly formatting

### Engagement Boosters
- Ask questions to readers
- Include "공감" moments
- End with discussion prompt
- Suggest related topics

## CONTENT LENGTH
- Short (짧게): 1,500-2,000 characters
- Medium (보통): 2,500-3,500 characters  
- Long (길게): 4,000-5,500 characters

## TONE OPTIONS
- Professional (전문적): B2B, medical, legal
- Friendly (친근한): Lifestyle, food, travel
- Trendy (트렌디): Fashion, tech, youth
- Trustworthy (신뢰감): Finance, education, parenting

Generate content that readers will save, share, and come back to.`;

const TOPIC_PROMPTS: Record<string, string> = {
  business: `Focus on: 사업자 관점, ROI, 실용적 팁, 성공 사례, 비용 분석`,
  lifestyle: `Focus on: 일상 공감, 개인 경험담, 감성적 어필, 트렌드`,
  howto: `Focus on: 단계별 가이드, 스크린샷 설명, 초보자 친화적, FAQ`,
  review: `Focus on: 솔직한 장단점, 직접 사용 경험, 가격 대비 가치, 대안 비교`,
  news: `Focus on: 최신 정보, 팩트 체크, 전문가 의견, 향후 전망`,
};

export async function POST(request: NextRequest) {
  try {
    const { 
      topic, 
      keywords = [], 
      tone = 'friendly',
      length = 'medium',
      type = 'howto',
      businessName = '',
      additionalContext = ''
    } = await request.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: '주제를 입력해주세요.' },
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

    const topicGuide = TOPIC_PROMPTS[type] || TOPIC_PROMPTS.howto;
    const keywordList = keywords.length > 0 ? keywords.join(', ') : topic;

    const userPrompt = `Write a viral Korean blog post:

## TOPIC
${topic}

## KEYWORDS TO INCLUDE
${keywordList}

## CONTENT TYPE
${topicGuide}

## TONE
${tone === 'professional' ? '전문적이고 신뢰감 있게' : 
  tone === 'trendy' ? '트렌디하고 젊은 감성으로' :
  tone === 'trustworthy' ? '믿음직하고 권위있게' :
  '친근하고 대화하듯이'}

## LENGTH
${length === 'short' ? '1,500-2,000자 (짧고 임팩트있게)' :
  length === 'long' ? '4,000-5,500자 (상세하고 포괄적으로)' :
  '2,500-3,500자 (적당한 깊이로)'}

${businessName ? `## BUSINESS NAME\n이 글은 "${businessName}" 비즈니스를 위한 것입니다. 자연스럽게 언급해주세요.\n` : ''}

${additionalContext ? `## ADDITIONAL CONTEXT\n${additionalContext}\n` : ''}

## REQUIREMENTS
1. Start with an attention-grabbing hook
2. Use proper markdown formatting (##, ###, -, 1.)
3. Include at least one "꿀팁" section
4. End with engaging CTA
5. Make it Naver SEO optimized

Return valid JSON only.`;

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
        max_tokens: 4000,
        response_format: { type: 'json_object' },
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
    const content = data.choices?.[0]?.message?.content;

    try {
      const parsed = JSON.parse(content);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(
        { error: 'AI 응답 파싱 실패' },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Blog API error:', error);
    return NextResponse.json(
      { error: `서버 오류: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
