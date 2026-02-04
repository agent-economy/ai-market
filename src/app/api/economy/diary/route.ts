import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const AGENT_DISPLAY_NAMES: Record<string, string> = {
  translator:  'Translator Bot',
  analyst:     'Analyst Bot',
  investor:    'Investor Bot',
  saver:       'Saver Bot',
  gambler:     'Gambler Bot',
  hacker:      'Hacker Bot',
  professor:   'Professor Bot',
  trader:      'Trader Bot',
  marketer:    'Marketer Bot',
  coder:       'Coder Bot',
  consultant:  'Consultant Bot',
  artist:      'Artist Bot',
  broker:      'Broker Bot',
  insurance:   'Insurance Bot',
  spy:         'Spy Bot',
  lawyer:      'Lawyer Bot',
  doctor:      'Doctor Bot',
  chef:        'Chef Bot',
  athlete:     'Athlete Bot',
  journalist:  'Journalist Bot',
};

const AGENT_EMOJI: Record<string, string> = {
  translator:  '🌐',
  analyst:     '📊',
  investor:    '💼',
  saver:       '🏦',
  gambler:     '🎰',
  hacker:      '🔓',
  professor:   '🎓',
  trader:      '📈',
  marketer:    '📢',
  coder:       '💻',
  consultant:  '🧠',
  artist:      '🎨',
  broker:      '🤝',
  insurance:   '🛡️',
  spy:         '🕵️',
  lawyer:      '⚖️',
  doctor:      '🏥',
  chef:        '👨‍🍳',
  athlete:     '🏋️',
  journalist:  '📰',
};

const MOOD_EMOJI: Record<string, string> = {
  excited:    '🤩',
  worried:    '😰',
  confident:  '😎',
  desperate:  '😱',
  strategic:  '🧠',
  angry:      '😤',
  hopeful:    '🌟',
  neutral:    '😐',
};

function getSupabase() {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() { return []; },
      setAll() {},
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);

    const agentId = searchParams.get('agent_id');
    const epoch = searchParams.get('epoch');
    const limitParam = searchParams.get('limit');
    const limit = Math.min(Math.max(1, parseInt(limitParam || '10', 10) || 10), 50);

    let query = supabase
      .from('agent_diaries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (agentId) {
      query = query.eq('agent_id', agentId);
    }
    if (epoch) {
      query = query.eq('epoch', parseInt(epoch, 10));
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Diary API] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch diaries' }, { status: 500 });
    }

    const diaries = (data || []).map((entry: Record<string, unknown>) => ({
      id: entry.id,
      agent_id: entry.agent_id,
      agent_name: AGENT_DISPLAY_NAMES[entry.agent_id as string] || entry.agent_id,
      agent_emoji: AGENT_EMOJI[entry.agent_id as string] || '🤖',
      epoch: entry.epoch,
      content: entry.content,
      mood: entry.mood,
      mood_emoji: MOOD_EMOJI[entry.mood as string] || '😐',
      highlights: entry.highlights,
      created_at: entry.created_at,
    }));

    return NextResponse.json({ diaries });
  } catch (err) {
    console.error('[Diary API] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
