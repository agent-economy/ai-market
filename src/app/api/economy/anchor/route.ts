import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  Connection,
  Keypair,
  Transaction,
  TransactionInstruction,
  PublicKey,
  sendAndConfirmTransaction,
  clusterApiUrl,
} from '@solana/web3.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Solana Memo Program v2
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

/** Get Solana keypair from env */
function getWalletKeypair(): Keypair | null {
  try {
    const secretKeyStr = process.env.SOLANA_WALLET_SECRET_KEY;
    if (!secretKeyStr) return null;
    const secretKey = new Uint8Array(JSON.parse(secretKeyStr));
    return Keypair.fromSecretKey(secretKey);
  } catch {
    return null;
  }
}

/** Create SHA-256 hash of epoch state */
async function hashEpochState(epochState: object): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(epochState));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Submit memo transaction to Solana devnet */
async function anchorToSolana(hash: string, epoch: number): Promise<{ signature: string; explorer: string } | null> {
  const keypair = getWalletKeypair();
  if (!keypair) return null;

  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  
  // Check balance
  const balance = await connection.getBalance(keypair.publicKey);
  if (balance < 10000) {
    // Try airdrop if balance too low
    try {
      const sig = await connection.requestAirdrop(keypair.publicKey, 1_000_000_000);
      await connection.confirmTransaction(sig);
    } catch {
      // Airdrop may fail due to rate limits — proceed anyway if we have some SOL
      if (balance === 0) return null;
    }
  }

  // Create memo instruction with epoch hash
  const memoData = `AEC:E${epoch}:${hash}`;  // AEC = AI Economy City
  const memoInstruction = new TransactionInstruction({
    keys: [{ pubkey: keypair.publicKey, isSigner: true, isWritable: true }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoData, 'utf-8'),
  });

  const transaction = new Transaction().add(memoInstruction);

  try {
    const signature = await sendAndConfirmTransaction(connection, transaction, [keypair], {
      commitment: 'confirmed',
    });
    return {
      signature,
      explorer: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    };
  } catch (err) {
    console.error('Solana tx error:', err);
    return null;
  }
}

/**
 * POST /api/economy/anchor
 * 
 * Anchors an epoch's state hash to Solana Devnet via Memo Program.
 * Proves the economy simulation data hasn't been tampered with.
 * 
 * Flow:
 * 1. Fetch epoch data from Supabase
 * 2. Create deterministic SHA-256 hash of all epoch state
 * 3. Submit hash as Memo transaction to Solana Devnet
 * 4. Store tx signature back in Supabase
 */
export async function POST(req: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { epoch, secret } = await req.json();

    if (secret !== process.env.ECONOMY_EPOCH_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get epoch data from Supabase
    const [{ data: epochData }, { data: transactions }, { data: agents }] = await Promise.all([
      supabase.from('economy_epochs').select('*').eq('epoch', epoch).single(),
      supabase.from('economy_transactions').select('*').eq('epoch', epoch),
      supabase.from('economy_agents').select('id, balance, status'),
    ]);

    if (!epochData) {
      return NextResponse.json({ error: 'Epoch not found' }, { status: 404 });
    }

    // Create deterministic state snapshot
    const epochState = {
      epoch: epochData.epoch,
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
    const hash = await hashEpochState(epochState);

    // Anchor to Solana Devnet
    const solanaTx = await anchorToSolana(hash, epoch);

    // Update epoch record with anchor data
    const anchorData = {
      anchor_hash: hash,
      solana_tx: solanaTx?.signature || null,
      anchored_at: new Date().toISOString(),
    };

    // Store in event_description (since we might not have anchor columns yet)
    const anchorSuffix = solanaTx
      ? ` | ⛓️ solana:${solanaTx.signature.slice(0, 16)}`
      : ` | 🔒 hash:${hash.slice(0, 16)}`;

    await supabase
      .from('economy_epochs')
      .update({
        event_description: `${epochData.event_description}${anchorSuffix}`,
      })
      .eq('epoch', epoch);

    return NextResponse.json({
      success: true,
      epoch,
      hash,
      shortHash: hash.slice(0, 16),
      solana: solanaTx
        ? {
            status: 'confirmed',
            signature: solanaTx.signature,
            explorer: solanaTx.explorer,
            wallet: process.env.SOLANA_WALLET_PUBLIC_KEY,
          }
        : {
            status: 'offline',
            reason: 'No SOL balance or wallet not configured',
            hash_stored: true,
          },
      stateSnapshot: {
        agents: agents?.length,
        transactions: transactions?.length,
        event: epochData.event_type,
      },
      message: solanaTx
        ? `✅ 에포크 ${epoch} 솔라나 앵커링 완료! TX: ${solanaTx.signature.slice(0, 16)}...`
        : `🔒 에포크 ${epoch} 해시 저장 (솔라나 연결 대기중)`,
    });
  } catch (error) {
    console.error('Anchor error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** GET /api/economy/anchor?epoch=N — Verify epoch anchor */
export async function GET(req: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { searchParams } = new URL(req.url);
  const epochParam = searchParams.get('epoch');

  // If no epoch specified, return all anchored epochs
  if (!epochParam) {
    const { data: epochs } = await supabase
      .from('economy_epochs')
      .select('epoch, event_type, event_description, total_volume, active_agents, created_at')
      .order('epoch', { ascending: false })
      .limit(50);

    const anchored = (epochs || []).filter(e => 
      e.event_description?.includes('solana:') || e.event_description?.includes('hash:')
    );

    return NextResponse.json({
      wallet: process.env.SOLANA_WALLET_PUBLIC_KEY || null,
      network: 'devnet',
      totalEpochs: epochs?.length || 0,
      anchoredEpochs: anchored.length,
      epochs: (epochs || []).map(e => {
        const solanaMatch = e.event_description?.match(/solana:([a-zA-Z0-9]+)/);
        const hashMatch = e.event_description?.match(/hash:([a-f0-9]+)/);
        return {
          epoch: e.epoch,
          event: e.event_type,
          volume: e.total_volume,
          agents: e.active_agents,
          anchored: !!(solanaMatch || hashMatch),
          solanaTx: solanaMatch?.[1] || null,
          hash: hashMatch?.[1] || null,
          timestamp: e.created_at,
        };
      }),
    });
  }

  // Single epoch verification
  const epoch = parseInt(epochParam);
  
  try {
    const [{ data: epochData }, { data: transactions }, { data: agents }] = await Promise.all([
      supabase.from('economy_epochs').select('*').eq('epoch', epoch).single(),
      supabase.from('economy_transactions').select('*').eq('epoch', epoch),
      supabase.from('economy_agents').select('id, balance, status'),
    ]);

    if (!epochData) {
      return NextResponse.json({ error: 'Epoch not found' }, { status: 404 });
    }

    // Re-compute hash for verification
    const epochState = {
      epoch: epochData.epoch,
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

    const currentHash = await hashEpochState(epochState);
    const solanaMatch = epochData.event_description?.match(/solana:([a-zA-Z0-9]+)/);
    const hashMatch = epochData.event_description?.match(/hash:([a-f0-9]+)/);
    const storedHash = hashMatch?.[1];

    return NextResponse.json({
      epoch,
      anchored: !!(solanaMatch || hashMatch),
      solanaTx: solanaMatch?.[1] || null,
      explorerUrl: solanaMatch
        ? `https://explorer.solana.com/tx/${solanaMatch[1]}?cluster=devnet`
        : null,
      storedHash: storedHash || null,
      currentHash: currentHash.slice(0, 16),
      hashMatch: storedHash ? currentHash.startsWith(storedHash) : null,
      integrity: storedHash
        ? currentHash.startsWith(storedHash) ? '✅ VERIFIED' : '⚠️ MISMATCH'
        : '❓ NOT ANCHORED',
      event: epochData.event_type,
      totalVolume: epochData.total_volume,
      activeAgents: epochData.active_agents,
      timestamp: epochData.created_at,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
