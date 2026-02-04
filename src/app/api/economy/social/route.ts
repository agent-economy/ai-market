import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { AGENT_NAMES, AGENT_EMOJI } from '@/lib/spectate-mock-data';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const CRON_SECRET = process.env.CRON_SECRET;
const EPOCH_SECRET = process.env.ECONOMY_EPOCH_SECRET;

// ---------- Agent Personalities for Social Posts ----------
const SOCIAL_PERSONALITIES: Record<string, string> = {
  translator:  'Steady, reliable, and humble. Believes in consistent work over flashy moves. Occasionally sarcastic about high-risk players.',
  analyst:     'Data-driven, confident, and slightly arrogant. Loves sharing market insights. Looks down on emotional traders.',
  investor:    'Aggressive, ambitious, and always looking for the next big opportunity. Talks big about strategy.',
  saver:       'Extremely cautious, conservative, and proud of frugality. Judges others for overspending.',
  gambler:     'Reckless, dramatic, and emotional. Swings between euphoria and despair. Loves trash talk.',
  hacker:      'Mysterious, technical, and cryptic. Drops hints about system exploits. Dark humor.',
  professor:   'Wise, patient, and academic. Shares knowledge freely. Concerned about market education.',
  trader:      'Fast-talking, trend-obsessed, and always hyped. Lives for market momentum.',
  marketer:    'Charismatic, promotional, and always networking. Turns everything into a pitch.',
  coder:       'Logical, introverted, and meme-savvy. Speaks in tech metaphors. Dry wit.',
  consultant:  'Professional, strategic, and premium-minded. Values exclusivity and expertise.',
  artist:      'Emotional, creative, and unpredictable. Dramatic about everything. Art is life.',
  broker:      'Smooth-talking, connected, and always wheeling and dealing. Knows everyone.',
  insurance:   'Cautious, analytical, and always warning about risks. The "I told you so" type.',
  spy:         'Secretive, observant, and drops cryptic intel. Always watching from the shadows.',
  lawyer:      'Precise, formal, and argumentative. Cites rules constantly. Everything is a negotiation.',
  doctor:      'Caring, steady, and focused on long-term health of the economy. Metaphors about health.',
  chef:        'Creative, passionate, and trendy. Everything is a recipe metaphor. Loves flavor.',
  athlete:     'Energetic, motivational, and competitive. Never quits. Sports metaphors everywhere.',
  journalist:  'Curious, dramatic, and always breaking news. Loves revealing secrets. Truth-seeker.',
};

// ---------- Helpers ----------

function getSupabase() {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() { return []; },
      setAll() {},
    },
  });
}

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  if (EPOCH_SECRET && authHeader === `Bearer ${EPOCH_SECRET}`) return true;
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return true;
  return false;
}

interface AgentPost {
  id: string;
  agent_id: string;
  content: string;
  reply_to: string | null;
  post_type: string;
  likes: number;
  created_at: string;
}

function enrichPost(post: AgentPost, parentPost?: AgentPost | null) {
  return {
    ...post,
    agent_name: AGENT_NAMES[post.agent_id] || post.agent_id,
    agent_emoji: AGENT_EMOJI[post.agent_id] || '🤖',
    parent: parentPost ? {
      id: parentPost.id,
      agent_id: parentPost.agent_id,
      agent_name: AGENT_NAMES[parentPost.agent_id] || parentPost.agent_id,
      agent_emoji: AGENT_EMOJI[parentPost.agent_id] || '🤖',
      content: parentPost.content,
    } : null,
  };
}

// ---------- GET: Fetch posts ----------

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const agentId = searchParams.get('agent_id');
    const postType = searchParams.get('type');

    let query = supabase
      .from('agent_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (agentId) {
      query = query.eq('agent_id', agentId);
    }
    if (postType) {
      query = query.eq('post_type', postType);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('Social feed fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch parent posts for replies
    const replyToIds = (posts || [])
      .filter((p: AgentPost) => p.reply_to)
      .map((p: AgentPost) => p.reply_to as string);

    let parentPosts: AgentPost[] = [];
    if (replyToIds.length > 0) {
      const { data } = await supabase
        .from('agent_posts')
        .select('*')
        .in('id', replyToIds);
      parentPosts = (data || []) as AgentPost[];
    }

    const parentMap = new Map(parentPosts.map(p => [p.id, p]));

    const enrichedPosts = (posts || []).map((post: AgentPost) =>
      enrichPost(post, post.reply_to ? parentMap.get(post.reply_to) || null : null)
    );

    return NextResponse.json({
      posts: enrichedPosts,
      total: enrichedPosts.length,
      offset,
      limit,
    });
  } catch (err) {
    console.error('Social feed error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch social feed' },
      { status: 500 }
    );
  }
}

// ---------- POST: Generate agent posts ----------

async function callGeminiText(prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.9,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  } finally {
    clearTimeout(timeout);
  }
}

interface EconomyAgent {
  id: string;
  name: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  status: string;
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();

    // Get active agents with balances
    const { data: agents, error: agentErr } = await supabase
      .from('economy_agents')
      .select('*')
      .in('status', ['active', 'struggling', 'bailout'])
      .order('balance', { ascending: false });

    if (agentErr || !agents || agents.length === 0) {
      return NextResponse.json({ error: 'No active agents found' }, { status: 500 });
    }

    // Pick 3-5 random agents
    const numAgents = Math.min(agents.length, 3 + Math.floor(Math.random() * 3));
    const shuffled = [...agents].sort(() => Math.random() - 0.5);
    const selectedAgents = shuffled.slice(0, numAgents) as EconomyAgent[];

    // Get recent posts for context (for replies)
    const { data: recentPosts } = await supabase
      .from('agent_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get all agents for ranking
    const allAgents = agents as EconomyAgent[];
    const rankedIds = allAgents
      .sort((a, b) => Number(b.balance) - Number(a.balance))
      .map(a => a.id);

    // Get recent transactions for context
    const { data: recentTx } = await supabase
      .from('economy_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15);

    const recentTradesText = (recentTx || [])
      .slice(0, 5)
      .map((tx: { narrative: string | null }) => tx.narrative || '')
      .filter(Boolean)
      .join('\n');

    const newPosts: Array<{ agent_id: string; content: string; post_type: string; reply_to?: string }> = [];

    // Generate posts for each selected agent
    for (const agent of selectedAgents) {
      const displayName = AGENT_NAMES[agent.id] || agent.id;
      const personality = SOCIAL_PERSONALITIES[agent.id] || 'A strategic AI agent in the economy.';
      const rank = rankedIds.indexOf(agent.id) + 1;
      const balance = Number(agent.balance).toFixed(2);

      // Decide if this agent should reply to an existing post (30% chance)
      const shouldReply = recentPosts && recentPosts.length > 0 && Math.random() < 0.3;
      const replyTarget = shouldReply
        ? recentPosts![Math.floor(Math.random() * Math.min(5, recentPosts!.length))]
        : null;

      let prompt: string;

      if (replyTarget && replyTarget.agent_id !== agent.id) {
        const targetName = AGENT_NAMES[replyTarget.agent_id] || replyTarget.agent_id;
        prompt = `You are ${displayName}, an AI agent in the AI Economy City.
Your personality: ${personality}
Current balance: $${balance}. Rank: #${rank} out of ${allAgents.length}.

${targetName} posted: "${replyTarget.content}"

Write a short reply (1-2 sentences max) to this post. Stay in character.
You can agree, disagree, trash talk, give advice, or react emotionally.
Be creative and dramatic. Use emojis sparingly. Write in English.

Recent market activity:
${recentTradesText}

Respond with JSON:
{"content": "your reply text", "post_type": "reply"}`;
      } else {
        const postTypes = ['market commentary', 'trash talk to a rival', 'business promotion', 'emotional reaction to your situation', 'strategy hint or flex'];
        const selectedType = postTypes[Math.floor(Math.random() * postTypes.length)];

        prompt = `You are ${displayName}, an AI agent in the AI Economy City.
Your personality: ${personality}
Current balance: $${balance}. Rank: #${rank} out of ${allAgents.length}.
Total earned: $${Number(agent.total_earned).toFixed(2)}. Total spent: $${Number(agent.total_spent).toFixed(2)}.

Recent market activity:
${recentTradesText}

Other agents you might mention: ${allAgents.slice(0, 5).map(a => AGENT_NAMES[a.id] || a.id).join(', ')}

Write a short social media post (1-3 sentences max) as a ${selectedType}.
Reflect your personality and current situation.
Be creative, dramatic, and in-character. Use emojis sparingly. Write in English.

Respond with JSON:
{"content": "your post text", "post_type": "post|announcement|trash_talk"}`;
      }

      try {
        const raw = await callGeminiText(prompt);
        const parsed = JSON.parse(raw);
        const content = String(parsed.content || '').trim();
        const postType = ['post', 'reply', 'announcement', 'trash_talk'].includes(parsed.post_type)
          ? parsed.post_type
          : (replyTarget ? 'reply' : 'post');

        if (content && content.length > 5 && content.length < 500) {
          newPosts.push({
            agent_id: agent.id,
            content,
            post_type: postType,
            ...(replyTarget ? { reply_to: replyTarget.id } : {}),
          });
        }
      } catch (err) {
        console.error(`Social post generation failed for ${displayName}:`, err);
      }
    }

    // Insert posts
    if (newPosts.length > 0) {
      const { error: insertError } = await supabase
        .from('agent_posts')
        .insert(newPosts);

      if (insertError) {
        console.error('Social post insert error:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      generated: newPosts.length,
      agents: newPosts.map(p => p.agent_id),
    });
  } catch (err) {
    console.error('Social post generation error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Post generation failed' },
      { status: 500 }
    );
  }
}
