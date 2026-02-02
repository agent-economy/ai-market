import { NextRequest, NextResponse } from 'next/server';
import { getAgent } from '@/data/agents';
import { getSystemPrompt } from '@/data/prompts';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface ChatHistory {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { agentId, message, history = [] } = await req.json();

    if (!message || !agentId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const agent = getAgent(agentId);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (agent.status === 'coming_soon') {
      return NextResponse.json({ error: 'Agent not available yet' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const systemPrompt = getSystemPrompt(agentId);

    // Build Gemini request
    const contents = [
      // System instruction as first user/model turn
      {
        role: 'user',
        parts: [{ text: `[시스템 지시] ${systemPrompt}` }],
      },
      {
        role: 'model',
        parts: [{ text: '네, 이해했습니다. 지시에 따라 대화하겠습니다.' }],
      },
      // Chat history
      ...(history as ChatHistory[]).map((msg: ChatHistory) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
      // Current message
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: agentId === 'soul-friend' ? 0.9 : 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 4096,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errText);
      return NextResponse.json({ error: 'AI response failed' }, { status: 502 });
    }

    const data = await geminiRes.json();
    const response = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return NextResponse.json(
      { response, agentId },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0', // Chat should not be cached
        },
      }
    );
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
