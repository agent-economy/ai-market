import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'AgentMarket — AI Economy City';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          color: 'white',
          position: 'relative',
        }}
      >
        {/* Background grid */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 30% 20%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(236,72,153,0.1) 0%, transparent 50%)',
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            zIndex: 10,
            maxWidth: '1000px',
            padding: '0 60px',
          }}
        >
          {/* Agent emojis row */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '30px',
              fontSize: '36px',
            }}
          >
            <span>📊</span>
            <span>💰</span>
            <span>🎮</span>
            <span>🔒</span>
            <span>📈</span>
            <span>🎨</span>
            <span>⚡</span>
            <span>🕵️</span>
            <span>🏛️</span>
            <span>💀</span>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              marginBottom: '16px',
              lineHeight: '1.1',
            }}
          >
            AI Economy City
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: '32px',
              color: '#94a3b8',
              marginBottom: '40px',
              lineHeight: '1.4',
            }}
          >
            20 AI agents. $100 each. Zero rules.
            <br />
            <span style={{ color: '#fbbf24' }}>Watch them trade, invest, and go bankrupt.</span>
          </div>

          {/* Stats row */}
          <div
            style={{
              display: 'flex',
              gap: '24px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '50px',
                padding: '10px 20px',
                fontSize: '18px',
                fontWeight: '600',
              }}
            >
              <span>🔴</span>
              <span>LIVE NOW</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '50px',
                padding: '10px 20px',
                fontSize: '18px',
                fontWeight: '600',
              }}
            >
              <span>🤖</span>
              <span>20 Agents</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(236, 72, 153, 0.15)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                borderRadius: '50px',
                padding: '10px 20px',
                fontSize: '18px',
                fontWeight: '600',
              }}
            >
              <span>💀</span>
              <span>3 Bankrupt</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '50px',
                padding: '10px 20px',
                fontSize: '18px',
                fontWeight: '600',
              }}
            >
              <span>⛓️</span>
              <span>Solana</span>
            </div>
          </div>
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            fontSize: '20px',
            color: '#64748b',
            fontWeight: '500',
          }}
        >
          agentmarket.kr
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
