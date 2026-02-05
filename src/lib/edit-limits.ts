import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Plan limits (fallback if DB not available)
const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  basic: 20,
  pro: 100,
  unlimited: -1, // -1 = unlimited
};

export interface EditLimitResult {
  canEdit: boolean;
  currentCount: number;
  limitCount: number;
  planName: string;
  message?: string;
}

/**
 * Check if user can edit and increment count
 */
export async function checkAndIncrementEditCount(
  userId: string | null,
  sessionId: string,
  slug: string
): Promise<EditLimitResult> {
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM

  try {
    if (userId) {
      // Logged in user - use user_id based tracking
      const { data, error } = await supabase.rpc('increment_edit_count', {
        p_user_id: userId,
        p_slug: slug,
      });

      if (error) {
        console.error('[edit-limits] RPC error:', error);
        // Fallback: allow edit but don't track
        return {
          canEdit: true,
          currentCount: 0,
          limitCount: PLAN_LIMITS.free,
          planName: '무료',
          message: '사용량 추적 오류 (편집은 허용)',
        };
      }

      const result = data?.[0];
      if (!result) {
        return {
          canEdit: true,
          currentCount: 1,
          limitCount: PLAN_LIMITS.free,
          planName: '무료',
        };
      }

      return {
        canEdit: result.can_edit,
        currentCount: result.current_count,
        limitCount: result.limit_count,
        planName: getPlanName(result.limit_count),
        message: result.can_edit ? undefined : '이번 달 편집 횟수를 모두 사용했어요. 업그레이드하세요!',
      };
    } else {
      // Anonymous user - use session_id based tracking
      // Check current count
      const { data: existing } = await supabase
        .from('anonymous_edit_usage')
        .select('edit_count')
        .eq('session_id', sessionId)
        .eq('month', month)
        .single();

      const currentCount = (existing?.edit_count || 0) + 1;
      const limit = PLAN_LIMITS.free;
      const canEdit = currentCount <= limit;

      if (canEdit) {
        // Increment count
        await supabase
          .from('anonymous_edit_usage')
          .upsert({
            session_id: sessionId,
            slug,
            month,
            edit_count: currentCount,
            last_edit_at: new Date().toISOString(),
          }, {
            onConflict: 'session_id,slug,month',
          });
      }

      return {
        canEdit,
        currentCount,
        limitCount: limit,
        planName: '무료 (비로그인)',
        message: canEdit ? undefined : '무료 편집 횟수를 모두 사용했어요. 로그인하고 업그레이드하세요!',
      };
    }
  } catch (err) {
    console.error('[edit-limits] Error:', err);
    // On error, allow edit (better UX than blocking)
    return {
      canEdit: true,
      currentCount: 0,
      limitCount: PLAN_LIMITS.free,
      planName: '무료',
      message: '사용량 확인 오류',
    };
  }
}

/**
 * Get current usage without incrementing
 */
export async function getEditUsage(
  userId: string | null,
  sessionId: string
): Promise<EditLimitResult> {
  const month = new Date().toISOString().slice(0, 7);

  try {
    if (userId) {
      const { data, error } = await supabase.rpc('get_monthly_usage', {
        p_user_id: userId,
      });

      if (error || !data?.[0]) {
        return {
          canEdit: true,
          currentCount: 0,
          limitCount: PLAN_LIMITS.free,
          planName: '무료',
        };
      }

      const result = data[0];
      return {
        canEdit: result.edit_limit === -1 || result.total_edits < result.edit_limit,
        currentCount: result.total_edits,
        limitCount: result.edit_limit,
        planName: result.plan_name,
      };
    } else {
      // Anonymous user
      const { data } = await supabase
        .from('anonymous_edit_usage')
        .select('edit_count')
        .eq('session_id', sessionId)
        .eq('month', month);

      const totalCount = data?.reduce((sum, row) => sum + (row.edit_count || 0), 0) || 0;
      const limit = PLAN_LIMITS.free;

      return {
        canEdit: totalCount < limit,
        currentCount: totalCount,
        limitCount: limit,
        planName: '무료 (비로그인)',
      };
    }
  } catch (err) {
    console.error('[edit-limits] Get usage error:', err);
    return {
      canEdit: true,
      currentCount: 0,
      limitCount: PLAN_LIMITS.free,
      planName: '무료',
    };
  }
}

function getPlanName(limit: number): string {
  switch (limit) {
    case -1: return '무제한';
    case 100: return '프로';
    case 20: return '베이직';
    default: return '무료';
  }
}
