import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { checkAndIncrementEditCount } from '@/lib/edit-limits';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Use OpenAI for vision capability, Groq for text-only edits
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const OPENAI_MODEL = 'gpt-4o-mini';

export const maxDuration = 60;

// Skip limit check in development
const SKIP_LIMIT_CHECK = process.env.NODE_ENV === 'development';

const EDIT_SYSTEM_PROMPT = `당신은 웹 페이지 HTML 수정 전문가입니다.
사용자의 수정 지시에 따라 기존 HTML을 정확하게 수정합니다.

규칙:
- 수정된 전체 HTML만 출력하세요 (설명 텍스트 없이)
- 코드블록 마커(\`\`\`html, \`\`\`) 절대 포함하지 마세요
- <!DOCTYPE html>로 시작해서 </html>로 끝나야 합니다
- 기존 스타일과 구조를 최대한 유지하면서 요청된 부분만 수정하세요
- 한국어 콘텐츠를 자연스럽게 유지하세요
- Tailwind CSS 클래스를 활용하세요
- 이미지 URL이 제공되면 해당 URL로 이미지를 교체하세요`;

interface EditRequestBody {
  slug: string;
  html?: string; // Optional: client can send current HTML for preview-only mode
  instruction: string;
  imageBase64?: string;
  sessionId?: string; // For anonymous edit tracking
}

// Upload image to Supabase Storage and return public URL
async function uploadImage(base64Data: string, slug: string): Promise<string | null> {
  try {
    // Extract mime type and data
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) return null;

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');

    // Generate unique filename
    const hash = crypto.randomBytes(8).toString('hex');
    const filename = `${slug}/${hash}.${ext}`;

    // Upload to Supabase Storage
    const { data: uploadData, error } = await supabase.storage
      .from('site-images')
      .upload(filename, buffer, {
        contentType: `image/${ext}`,
        upsert: true,
      });

    if (error) {
      console.error('[hosting/edit] Image upload error:', error);
      // Fallback: return the base64 data URI directly
      return base64Data;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('site-images')
      .getPublicUrl(filename);

    return urlData.publicUrl;
  } catch (err) {
    console.error('[hosting/edit] Image processing error:', err);
    return base64Data; // Fallback to base64
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: EditRequestBody = await req.json();
    const { slug, html: clientHtml, instruction, imageBase64, sessionId } = body;

    // 필수 필드 체크
    if (!slug || !instruction) {
      return NextResponse.json(
        { error: 'slug와 instruction은 필수 항목입니다.' },
        { status: 400 }
      );
    }

    if (instruction.length > 2000) {
      return NextResponse.json(
        { error: '수정 지시는 2000자 이내로 입력해주세요.' },
        { status: 400 }
      );
    }

    // Get user ID from auth header if present
    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Check edit limits (skip in development)
    if (!SKIP_LIMIT_CHECK) {
      const limitResult = await checkAndIncrementEditCount(
        userId,
        sessionId || 'anonymous',
        slug
      );

      if (!limitResult.canEdit) {
        return NextResponse.json(
          { 
            error: limitResult.message || '이번 달 편집 횟수를 모두 사용했어요.',
            limitReached: true,
            currentCount: limitResult.currentCount,
            limitCount: limitResult.limitCount,
            planName: limitResult.planName,
          },
          { status: 429 }
        );
      }
    }

    // Get current HTML from client or database
    let currentHtml: string | null = clientHtml || null;
    let sourceTable: 'hosted_pages' | 'sites' = 'hosted_pages';

    if (!currentHtml) {
      // Fetch from database
      const { data: hostedPage } = await supabase
        .from('hosted_pages')
        .select('html_content')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (hostedPage) {
        currentHtml = hostedPage.html_content;
        sourceTable = 'hosted_pages';
      } else {
        const { data: site } = await supabase
          .from('sites')
          .select('html_content')
          .eq('slug', slug)
          .eq('is_published', true)
          .single();

        if (site) {
          currentHtml = site.html_content;
          sourceTable = 'sites';
        }
      }
    }

    if (!currentHtml) {
      return NextResponse.json(
        { error: '해당 페이지를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Handle image upload if provided
    let imageUrl: string | null = null;
    if (imageBase64) {
      console.log('[hosting/edit] Processing image upload...');
      imageUrl = await uploadImage(imageBase64, slug);
      console.log('[hosting/edit] Image URL:', imageUrl ? 'success' : 'failed');
    }

    // Build instruction with image URL if available
    let fullInstruction = instruction;
    if (imageUrl) {
      fullInstruction = `${instruction}\n\n사용할 이미지 URL: ${imageUrl}`;
    }

    // Check API keys
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!openaiApiKey && !groqApiKey) {
      console.error('[hosting/edit] No AI API keys configured');
      return NextResponse.json(
        { error: 'AI 수정 기능을 사용할 수 없습니다. 관리자에게 문의해주세요.' },
        { status: 503 }
      );
    }

    // HTML이 너무 크면 잘라서 전송
    const MAX_HTML_LENGTH = 50000;
    const trimmedHtml = currentHtml.length > MAX_HTML_LENGTH
      ? currentHtml.slice(0, MAX_HTML_LENGTH) + '\n<!-- ... 이하 생략 ... -->\n</html>'
      : currentHtml;

    let modifiedHtml: string | null = null;

    // Try Groq first (faster and free), fall back to OpenAI
    if (groqApiKey) {
      try {
        console.log('[hosting/edit] Using Groq API...');
        const groqResponse = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
              { role: 'system', content: EDIT_SYSTEM_PROMPT },
              {
                role: 'user',
                content: `다음 HTML을 수정해주세요.\n\n수정 지시: ${fullInstruction}\n\n현재 HTML:\n${trimmedHtml}`,
              },
            ],
            temperature: 0.3,
            max_tokens: 8000,
          }),
        });

        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          modifiedHtml = groqData.choices?.[0]?.message?.content;
        } else {
          console.error('[hosting/edit] Groq failed:', groqResponse.status);
        }
      } catch (err) {
        console.error('[hosting/edit] Groq error:', err);
      }
    }

    // Fallback to OpenAI if Groq failed
    if (!modifiedHtml && openaiApiKey) {
      console.log('[hosting/edit] Falling back to OpenAI...');
      const openaiResponse = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: 'system', content: EDIT_SYSTEM_PROMPT },
            {
              role: 'user',
              content: `다음 HTML을 수정해주세요.\n\n수정 지시: ${fullInstruction}\n\n현재 HTML:\n${trimmedHtml}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 8000,
        }),
      });

      if (openaiResponse.ok) {
        const openaiData = await openaiResponse.json();
        modifiedHtml = openaiData.choices?.[0]?.message?.content;
      } else {
        const errorText = await openaiResponse.text();
        console.error('[hosting/edit] OpenAI error:', openaiResponse.status, errorText);
      }
    }

    if (!modifiedHtml) {
      return NextResponse.json(
        { error: 'AI 수정 요청에 실패했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 502 }
      );
    }

    // 코드블록 마커 제거
    modifiedHtml = modifiedHtml
      .replace(/^```html?\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim();

    // 기본 HTML 유효성 체크
    if (!modifiedHtml.includes('<!DOCTYPE') && !modifiedHtml.includes('<html')) {
      return NextResponse.json(
        { error: 'AI가 유효한 HTML을 생성하지 못했습니다. 다시 시도해주세요.' },
        { status: 502 }
      );
    }

    // Return HTML for preview (don't save yet - client will call /save when ready)
    return NextResponse.json({
      success: true,
      html: modifiedHtml,
      slug,
      url: `https://agentmarket.kr/s/${slug}`,
      message: imageUrl ? '이미지와 함께 수정 완료!' : '수정 완료!',
      imageUrl: imageUrl || undefined,
      // Include a hint about limits (actual count is tracked server-side)
      hint: SKIP_LIMIT_CHECK ? undefined : '편집 1회 사용',
    });
  } catch (err) {
    console.error('[hosting/edit] Unexpected error:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
