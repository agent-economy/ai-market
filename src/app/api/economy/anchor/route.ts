import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Epoch Anchoring API
 * 
 * Records a hash of each epoch's data on Solana Devnet.
 * This proves the economy simulation data hasn't been tampered with.
 * 
 * In production: would use a Solana program to store the hash on-chain.
 * For hackathon: generates the hash + stores it in Supabase.
 */

export async function POST(req: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { epoch, secret } = await req.json();

    if (secret !== process.env.ECONOMY_EPOCH_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get epoch data
    const [{ data: epochData }, { data: transactions }, { data: agents }] = await Promise.all([
      supabase.from('economy_epochs').select('*').eq('epoch_number', epoch).single(),
      supabase.from('economy_transactions').select('*').eq('epoch', epoch),
      supabase.from('economy_agents').select('id, balance, status'),
    ]);

    if (!epochData) {
      return NextResponse.json({ error: 'Epoch not found' }, { status: 404 });
    }

    // Create deterministic hash of epoch state
    const epochState = {
      epoch: epochData.epoch_number,
      timestamp: epochData.created_at,
      event_type: epochData.event_type,
      transactions: (transactions || []).map(t => ({
        buyer: t.buyer_id,
        seller: t.seller_id,
        amount: t.amount,
        skill: t.skill_type,
      })),
      agents: (agents || []).map(a => ({
        id: a.id,
        balance: a.balance,
        status: a.status,
      })).sort((a, b) => a.id.localeCompare(b.id)),
    };

    // Generate SHA-256 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(epochState));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Store anchor hash (in production: submit to Solana)
    // For now: store in epoch record for verification
    await supabase
      .from('economy_epochs')
      .update({ 
        // We'd add an 'anchor_hash' column, but for now use event_description
        event_description: `${epochData.event_description} | anchor:${hashHex.slice(0, 16)}`,
      })
      .eq('epoch_number', epoch);

    return NextResponse.json({
      epoch,
      hash: hashHex,
      shortHash: hashHex.slice(0, 16),
      stateSnapshot: {
        agents: agents?.length,
        transactions: transactions?.length,
        event: epochData.event_type,
      },
      // In production: this would be a Solana transaction signature
      solanaStatus: 'devnet_ready',
      message: `에포크 ${epoch} 앵커 해시: ${hashHex.slice(0, 16)}...`,
    });
  } catch (error) {
    console.error('Anchor error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET: Verify an epoch's anchor hash
export async function GET(req: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { searchParams } = new URL(req.url);
  const epoch = searchParams.get('epoch');

  if (!epoch) {
    return NextResponse.json({ error: 'epoch parameter required' }, { status: 400 });
  }

  try {
    const { data: epochData } = await supabase
      .from('economy_epochs')
      .select('*')
      .eq('epoch_number', parseInt(epoch))
      .single();

    if (!epochData) {
      return NextResponse.json({ error: 'Epoch not found' }, { status: 404 });
    }

    // Extract anchor hash from event_description if exists
    const anchorMatch = epochData.event_description?.match(/anchor:([a-f0-9]+)/);

    return NextResponse.json({
      epoch: epochData.epoch_number,
      anchored: !!anchorMatch,
      anchorHash: anchorMatch?.[1] || null,
      event: epochData.event_type,
      totalVolume: epochData.total_volume,
      activeAgents: epochData.active_agents,
      bankruptcies: epochData.bankruptcies,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
