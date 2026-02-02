# 🤖 에이전트마켓 (AgentMarket)

**한국 최초 AI 에이전트 마켓플레이스** — 목적에 맞는 AI를 골라 바로 사용하세요.

🌐 **라이브:** [agentmarket.kr](https://agentmarket.kr) | [ai-market-delta.vercel.app](https://ai-market-delta.vercel.app)

---

## 🎯 문제 (Problem)

ChatGPT는 "범용"이라 모든 걸 어중간하게 합니다.
네이버 블로그 SEO? 전세 계약서 분석? 한국 취업 자소서? — **한국 맥락을 아는 전문 AI가 필요합니다.**

## 💡 해결책 (Solution)

**에이전트마켓** = 한국 시장에 특화된 AI 에이전트들의 앱스토어

각 에이전트는:
- 🎯 **한 가지에 특화** — 블로그 SEO, 계약서 분석, 영어 교정 등
- 🇰🇷 **한국 맥락 이해** — 네이버 C-Rank, 전세가율, STAR 자소서, 종소세
- 💬 **즉시 사용 가능** — 가입 없이 바로 대화
- ⚡ **실시간 스트리밍** — 타이핑하듯 자연스러운 응답

## 📊 현재 상태

| 항목 | 수치 |
|------|------|
| 라이브 에이전트 | 13개 |
| 카테고리 | 6개 (대화, 비즈니스, 교육, 생산성, 크리에이티브, 라이프) |
| API 연동 | Gemini 2.0 Flash (실시간 스트리밍) |
| 배포 | Vercel Edge (글로벌 CDN) |
| 빌드 시간 | **~3시간** (0:17 → 계속 고도화 중) |

## 🚀 에이전트 라인업

### 💜 소울프렌드 — AI 베스트프렌드
진짜 친구처럼 대화. "이해합니다" 따위 없음. "야 그 새끼 너무하다" 수준의 리얼 친구.

### ✍️ 블로그마스터 — 네이버 SEO AI
C-Rank + D.I.A 알고리즘 이해. 소상공인 매출을 올려주는 블로그 글 자동 생성.

### 🛡️ 계약서지킴이 — 계약 분석 AI
전세/월세/근로계약 위험 조항 자동 탐지. 서명 전 필수 체크.

### 🚀 스타트업멘토 — 창업 AI 멘토
TIPS, 시드VC, 피치덱 구성까지. 한국 스타트업 생태계를 아는 AI.

### 📄 이력서프로 — 자소서 AI
대기업/공기업/스타트업별 맞춤. STAR 기법 + 글자수 최적화.

### 🗣️ 영어회화AI — 영어 학습
한국인 빈출 실수 TOP 10 교정. 프리토킹/비즈니스/시험 모드.

### 🎓 공부메이트 — AI 공부 친구
비유로 쉽게 설명. 수능/자격증/코딩 전부 커버.

### 💻 코드헬퍼 — 코딩 AI
디버깅/코드리뷰/설계. 한국어 주석 포함.

### 📱 SNS크리에이터 — 콘텐츠 AI
인스타/틱톡/유튜브 캡션 + 해시태그 + A/B 테스트 변형.

### ✈️ 여행플래너 — 여행 코스 AI
국내/해외 맞춤 일정. 예산/교통/맛집 한 번에.

### 🧾 세금도우미 — 세금 AI
프리랜서 종소세, 소상공인 부가세. 절세 전략까지.

### 🍳 냉장고파먹기 — 레시피 AI
냉장고 재료 → 레시피. 자취생 필수.

### 🌿 마음일기 — 감정 케어 AI
CBT 기반 감정 분석 + 마음 챙김 가이드.

## 🛠️ 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | **Next.js 16** + TypeScript + Tailwind CSS 4 |
| AI | **Google Gemini 2.0 Flash** (스트리밍) |
| Animation | Framer Motion |
| Markdown | react-markdown + remark-gfm |
| Backend | Next.js API Routes (Edge Runtime) |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Hosting | Vercel (글로벌 Edge Network) |
| Domain | agentmarket.kr (가비아) |

## 📐 아키텍처

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│  Next.js API │────▶│  Gemini AI  │
│  (React)    │◀────│  (SSE Stream)│◀────│  (2.0 Flash)│
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │  Supabase   │
                    │ (Auth + DB) │
                    └─────────────┘
```

### SSE 스트리밍 플로우
1. 클라이언트 → `/api/chat/stream` POST
2. 서버 → Gemini `streamGenerateContent` SSE 연결
3. Gemini 청크 → 서버 파싱 → 클라이언트 SSE 전달
4. 클라이언트 실시간 렌더링 (타이핑 효과)

## ⚡ 빌드 타임라인

> **Solo founder + AI pair programming (Clo 🐾)**

| 시간 | 마일스톤 |
|------|----------|
| 00:17 | 프로젝트 생성 (`create-next-app`) |
| 00:42 | **MVP v0.1** — 랜딩 + 8 에이전트 + 채팅 + Gemini API (**25분**) |
| 01:13 | 킬러 프롬프트 v2 — 6개 에이전트 전문 프롬프트 |
| 01:21 | 한국식 라이트 테마 리뉴얼 (토스/당근 스타일) |
| 01:32 | 에이전트 13개 확장 + 전체 프롬프트 고도화 |
| 01:36 | SSE 스트리밍 + 마크다운 렌더링 |
| 계속... | Auth, 결제, 카카오 연동, 마케팅 |

## 📈 로드맵

- [x] ~~MVP 랜딩 + 에이전트 카탈로그~~
- [x] ~~Gemini 2.0 Flash 채팅~~
- [x] ~~13개 에이전트 + 전문 프롬프트~~
- [x] ~~SSE 실시간 스트리밍~~
- [x] ~~마크다운 렌더링 (코드 하이라이팅, 테이블)~~
- [ ] Supabase Auth (카카오 + 구글 로그인)
- [ ] 대화 히스토리 저장
- [ ] 카카오톡 챗봇 연동
- [ ] 토스페이먼츠 결제
- [ ] 크리에이터 에이전트 등록 (오픈 마켓)
- [ ] 에이전트 평점/리뷰 시스템
- [ ] SEO 최적화 + 마케팅

## 🏃 로컬 실행

```bash
git clone https://github.com/hyunwoooim-star/ai-market.git
cd ai-market
pnpm install
cp .env.example .env.local
# .env.local에 GEMINI_API_KEY 추가
pnpm dev
```

## 📝 환경 변수

```env
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🤝 팀

**Han** — Founder & Product
**Clo 🐾** — AI Pair Programmer (24/7 빌드 파트너)

---

Built with ❤️ and AI in Seoul 🇰🇷

**Hashed Vibe Labs 2026 지원작**
