import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// slug 유효성: 영문 소문자 + 숫자 + 하이픈, 3-50자, 하이픈으로 시작/끝 불가
const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9\-]{1,48}[a-z0-9])?$/;

interface SaveRequestBody {
  slug: string;
  title: string;
  description?: string;
  html_content: string;
  business_type?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: SaveRequestBody = await req.json();
    const { slug, title, description, html_content, business_type } = body;

    // 필수 필드 체크
    if (!slug || !title || !html_content) {
      return NextResponse.json(
        { error: 'slug, title, html_content는 필수 항목입니다.' },
        { status: 400 }
      );
    }

    // slug 유효성 검사
    if (!SLUG_REGEX.test(slug)) {
      return NextResponse.json(
        {
          error: 'URL 주소는 영문 소문자, 숫자, 하이픈만 사용 가능합니다. (3~50자, 하이픈으로 시작/끝 불가)',
        },
        { status: 400 }
      );
    }

    // 예약어 체크
    const RESERVED_SLUGS = ['admin', 'api', 'app', 'create', 'edit', 'login', 'signup', 'settings', 'hosting', 'dashboard'];
    if (RESERVED_SLUGS.includes(slug)) {
      return NextResponse.json(
        { error: '이 URL 주소는 사용할 수 없습니다. 다른 주소를 입력해주세요.' },
        { status: 400 }
      );
    }

    // slug 중복 체크 (hosted_pages + sites 테이블 모두 확인)
    const [{ data: existingHosted }, { data: existingSite }] = await Promise.all([
      supabase.from('hosted_pages').select('id').eq('slug', slug).single(),
      supabase.from('sites').select('id').eq('slug', slug).single(),
    ]);

    if (existingHosted || existingSite) {
      const timestamp = Date.now().toString(36).slice(-4);
      return NextResponse.json(
        {
          error: '이미 사용 중인 URL 주소입니다.',
          suggestion: `${slug}-${timestamp}`,
        },
        { status: 409 }
      );
    }

    // HTML 크기 제한 (2MB)
    if (html_content.length > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'HTML 콘텐츠가 너무 큽니다. (최대 2MB)' },
        { status: 400 }
      );
    }

    // Supabase에 저장
    const { data, error } = await supabase
      .from('hosted_pages')
      .insert({
        slug,
        title,
        description: description || '',
        html_content,
        business_type: business_type || 'general',
        user_id: null, // 비로그인 MVP
        is_published: true, // 바로 공개
      })
      .select('id, slug, created_at')
      .single();

    if (error) {
      console.error('[hosting/save] Supabase insert error:', error);
      return NextResponse.json(
        { error: '페이지 저장에 실패했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      page: data,
      url: `https://agentmarket.kr/s/${slug}`,
    });
  } catch (err) {
    console.error('[hosting/save] Unexpected error:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
