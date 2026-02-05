import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '에이전트마켓 — AI 고용 플랫폼';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { locale: string } }) {
  const isKorean = params.locale === 'ko';
  
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.3)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-150px',
            left: '-150px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'rgba(139, 92, 246, 0.2)',
            display: 'flex',
          }}
        />
        
        {/* Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 24px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '40px',
            marginBottom: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <span style={{ fontSize: '28px', marginRight: '12px' }}>🤖</span>
          <span style={{ color: '#e0e7ff', fontSize: '24px', fontWeight: 500 }}>
            {isKorean ? 'AI 고용 플랫폼' : 'AI Hiring Platform'}
          </span>
        </div>

        {/* Main Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontSize: isKorean ? '72px' : '64px',
              fontWeight: 800,
              color: 'white',
              margin: 0,
              lineHeight: 1.2,
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
          >
            {isKorean ? 'AI가' : 'AI Works'}
          </h1>
          <h1
            style={{
              fontSize: isKorean ? '72px' : '64px',
              fontWeight: 800,
              background: 'linear-gradient(90deg, #a5b4fc, #c4b5fd, #f0abfc)',
              backgroundClip: 'text',
              color: 'transparent',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {isKorean ? '일합니다' : 'For You'}
          </h1>
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '28px',
            color: '#c7d2fe',
            marginTop: '32px',
            textAlign: 'center',
          }}
        >
          {isKorean 
            ? '웹사이트 30초 · 블로그 3분 · 광고 카피 즉시' 
            : 'Website in 30s · Blog in 3min · Ad Copy Instantly'}
        </p>

        {/* Logo */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>
            AgentMarket
          </span>
          <span style={{ fontSize: '24px', color: '#a5b4fc', marginLeft: '8px' }}>
            .kr
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
