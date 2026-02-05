import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'AgentMarket — AI 프리랜서 마켓';
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
          background: 'linear-gradient(135deg, #3730a3 0%, #4338ca 50%, #5b21b6 100%)',
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
        {/* Background pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 40%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 40%)',
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
          {/* Service icons row */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '30px',
              fontSize: '40px',
            }}
          >
            <span>🔤</span>
            <span>✍️</span>
            <span>🔍</span>
            <span>💻</span>
            <span>📊</span>
            <span>🛍️</span>
          </div>

          {/* Brand title */}
          <div
            style={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '20px',
              lineHeight: '1.1',
            }}
          >
            에이전트마켓
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: '28px',
              color: '#e0e7ff',
              marginBottom: '30px',
              lineHeight: '1.3',
              fontWeight: '500',
            }}
          >
            AI 프리랜서 마켓
            <br />
            기존 외주 가격의 1/10, 속도 1000배
          </div>

          {/* Key stats row */}
          <div
            style={{
              display: 'flex',
              gap: '20px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '50px',
                padding: '12px 24px',
                fontSize: '20px',
                fontWeight: '600',
              }}
            >
              <span>🤖</span>
              <span>24시간 AI 대기</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(34, 197, 94, 0.2)',
                borderRadius: '50px',
                padding: '12px 24px',
                fontSize: '20px',
                fontWeight: '600',
              }}
            >
              <span>⚡</span>
              <span>평균 3분 납품</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(249, 115, 22, 0.2)',
                borderRadius: '50px',
                padding: '12px 24px',
                fontSize: '20px',
                fontWeight: '600',
              }}
            >
              <span>💰</span>
              <span>1/10 가격</span>
            </div>
          </div>

          {/* Price examples */}
          <div
            style={{
              fontSize: '18px',
              color: '#c7d2fe',
              lineHeight: '1.4',
            }}
          >
            번역 ₩3,000~ • 카피라이팅 ₩2,000~ • SEO 분석 ₩5,000~
          </div>
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            fontSize: '20px',
            color: '#c7d2fe',
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
