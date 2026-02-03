import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fhrszauuowtahqfbfjxa.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocnN6YXV1b3d0YWhxZmJmanhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzOTU0MTYsImV4cCI6MjA1Mzk3MTQxNn0.wchBZ4C1FQj0GZYhKJRW9O02CLBiKkO9Rth7-30S0Ds';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component에서는 쿠키 설정 불가 — middleware에서 처리
        }
      },
    },
  });
}
