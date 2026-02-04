import { NextRequest, NextResponse } from 'next/server';
import { getUsageStats } from '@/lib/rate-limit';

// Admin authentication via header or query parameter
const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function GET(req: NextRequest) {
  if (!ADMIN_SECRET) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 503 });
  }

  const secret = req.headers.get('authorization')?.replace('Bearer ', '') 
    || req.nextUrl.searchParams.get('secret');

  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stats = getUsageStats();

  return NextResponse.json({
    ...stats,
    limits: {
      perMinutePerIP: 10,
      perHourPerIP: 60,
      dailyTotal: 5000,
      maxMessageLength: 3000,
      maxHistoryTurns: 20,
      maxOutputTokens: 2048,
    },
    geminiPricing: {
      model: 'gemini-2.0-flash',
      inputPerMillion: '$0.10',
      outputPerMillion: '$0.40',
      note: '하루 5,000건 기준 최대 ~$2.25/day ≈ ₩3,200/day',
    },
  });
}
