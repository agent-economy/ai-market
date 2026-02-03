import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import type { ChallengeEntry, ChallengeResponse } from '@/types/agent-registry';
import { checkRateLimit } from '@/lib/rate-limit';

// In-memory challenge store (token -> entry)
// Exported so registry route can access it
export const challengeStore = new Map<string, ChallengeEntry>();

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Cleanup expired challenges every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of challengeStore) {
    if (entry.expiresAt < now) challengeStore.delete(token);
  }
}, 2 * 60 * 1000);

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = checkRateLimit(`registry-challenge:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const nonce = randomBytes(16).toString('hex');
  const timestamp = Date.now();
  const challenge = `AgentMarket-Register:${nonce}:${timestamp}`;
  const token = randomBytes(32).toString('hex');

  const entry: ChallengeEntry = {
    challenge,
    nonce,
    timestamp,
    expiresAt: timestamp + CHALLENGE_TTL_MS,
  };
  challengeStore.set(token, entry);

  const resp: ChallengeResponse = {
    challenge,
    token,
    expiresAt: new Date(entry.expiresAt).toISOString(),
  };

  return NextResponse.json(resp);
}
