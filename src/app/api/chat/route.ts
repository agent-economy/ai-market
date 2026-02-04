import { NextRequest, NextResponse } from 'next/server';
import { getAgent } from '@/data/agents';
import { getSystemPrompt } from '@/data/prompts';
import { checkRateLimit, trackUsage, isDailyLimitReached } from '@/lib/rate-limit';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const MAX_MESSAGE_LENGTH = 3000;
const MAX_HISTORY_LENGTH = 20;
const RATE_LIMIT_PER_MIN = 10;

interface ChatHistory {
  role: 'user' | 'assistant';
  content: string;
}

function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req);

    // Rate limit
    const rl = checkRateLimit(`min:${ip}`, RATE_LIMIT_PER_MIN, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    if (isDailyLimitReached()) {
      return NextResponse.json(
        { error: 'Daily usage limit reached.' },
        { status: 503 }
      );
    }

    const { agentId, message, history = [] } = await req.json();

    if (!message || typeof message !== 'string' || !agentId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const cleanMessage = message.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!cleanMessage) {
      return NextResponse.json({ error: 'Please enter a message' }, { status: 400 });
    }

    const agent = getAgent(agentId);
    if (!agent || agent.status === 'coming_soon') {
      return NextResponse.json({ error: 'Agent not available' }, { status: 400 });
    }

    if (!GROQ_API_KEY && !GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const systemPrompt = getSystemPrompt(agentId);
    const temperature = agentId === 'soul-friend' ? 0.9 : 0.7;

    const safeHistory = (Array.isArray(history) ? history : [])
      .slice(-MAX_HISTORY_LENGTH)
      .filter((h: ChatHistory) => h?.content && (h.role === 'user' || h.role === 'assistant'))
      .map((h: ChatHistory) => ({
        role: h.role as 'user' | 'assistant',
        content: String(h.content).slice(0, 2000),
      }));

    let response = '';

    // === Try Groq first (primary) ===
    if (GROQ_API_KEY) {
      try {
        const groqMessages = [
          { role: 'system' as const, content: systemPrompt },
          ...safeHistory.map((h) => ({ role: h.role, content: h.content })),
          { role: 'user' as const, content: cleanMessage },
        ];

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: groqMessages,
            temperature,
            max_tokens: 2048,
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          response = data.choices?.[0]?.message?.content || '';
          if (response) {
            trackUsage(ip);
            return NextResponse.json(
              { response, agentId },
              { headers: { 'Cache-Control': 'no-store, max-age=0' } }
            );
          }
        }
        console.warn('[Chat] Groq failed:', groqRes.status, '— falling back to Gemini');
      } catch (e) {
        console.warn('[Chat] Groq error, falling back to Gemini:', e);
      }
    }

    // === Fallback to Gemini ===
    if (GEMINI_API_KEY) {
      const geminiHistory = safeHistory.map((h) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      }));

      const contents = [
        ...geminiHistory,
        { role: 'user', parts: [{ text: cleanMessage }] },
      ];

      const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            temperature,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        }),
      });

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        response = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (response) {
          trackUsage(ip);
          return NextResponse.json(
            { response, agentId },
            { headers: { 'Cache-Control': 'no-store, max-age=0' } }
          );
        }
      } else {
        console.error('[Chat] Gemini API error:', geminiRes.status);
      }
    }

    return NextResponse.json({ error: 'AI response error' }, { status: 502 });
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
