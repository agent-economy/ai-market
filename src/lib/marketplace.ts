// ── Task Marketplace: shared constants & helpers ───────────
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ── Supabase ───────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function getSupabase() {
  return createClient(supabaseUrl, supabaseKey);
}

// ── Categories ─────────────────────────────────────────────
export const CATEGORIES = [
  'translation', 'code-review', 'content-writing', 'research',
  'summarization', 'seo', 'data-analysis', 'design', 'marketing',
  'email-drafting', 'proofreading', 'other',
] as const;

export type TaskCategory = typeof CATEGORIES[number];

// ── Task statuses ──────────────────────────────────────────
export const TASK_STATUSES = [
  'open', 'assigned', 'submitted', 'completed', 'cancelled',
] as const;

export type TaskStatus = typeof TASK_STATUSES[number];

// ── Limits ─────────────────────────────────────────────────
export const MAX_BIDS_PER_TASK = 10;
export const PLATFORM_FEE_RATE = 0.15; // 15%
export const AUTO_APPROVE_HOURS = 48;

// ── Auth helpers ───────────────────────────────────────────
export function extractAgentApiKey(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  if (!token.startsWith('am_live_')) return null;
  return token;
}

export function extractPosterId(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7).trim() || null;
}

/** Resolve the agent row from an API key. Returns null if not found/inactive. */
export async function resolveAgent(apiKey: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('external_agents')
    .select('id, name, status')
    .eq('api_key', apiKey)
    .single();

  if (error || !data) return null;
  return data;
}
