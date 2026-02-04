// 프로젝트 상태 데이터 — Clo가 작업하면서 업데이트
// 마지막 업데이트: 2026-02-04 02:27 KST

export interface Task {
  name: string;
  done: boolean;
  current?: boolean; // 현재 진행 중
}

export interface Track {
  id: string;
  name: string;
  emoji: string;
  color: string; // tailwind gradient
  description: string;
  tasks: Task[];
}

export interface Milestone {
  date: string;
  title: string;
  done: boolean;
  emoji: string;
}

export interface ActivityItem {
  time: string;
  text: string;
  type: 'feat' | 'fix' | 'info' | 'milestone';
}

export const projectMeta = {
  name: 'AgentMarket',
  tagline: 'AI Agent Economy Ecosystem',
  startDate: '2026-02-02',
  dDay: '2026-02-18', // Hashed Vibe Labs
  hackathonDeadline: '2026-02-12', // Solana Agent Hackathon
  liveUrl: 'https://agentmarket.kr',
  github: 'https://github.com/hyunwoooim-star/ai-market',
  lastUpdated: '2026-02-04T02:27:00+09:00',
};

export const keyStats = [
  { label: 'Live Agents', value: '20', emoji: '🤖' },
  { label: 'Economy Agents', value: '20', emoji: '💰' },
  { label: 'LLM Provider', value: 'Groq', emoji: '⚡' },
  { label: '비전 문서', value: '5개', emoji: '📄' },
];

export const tracks: Track[] = [
  {
    id: 'research',
    name: '리서치 & 비전',
    emoji: '🔬',
    color: 'from-violet-500 to-purple-600',
    description: 'AI agent economy research, vision docs, KYA protocol',
    tasks: [
      { name: 'AI agent economy deep research (7 areas)', done: true },
      { name: '비전 문서 v1 + 경쟁사 분석', done: true },
      { name: '한국 크립토/AI 규제 리서치', done: true },
      { name: 'x402 + Google UCP/A2A + Visa TAP 리서치', done: true },
      { name: '비전 문서 v2 — "AI들의 도시" 테시스', done: true },
      { name: 'KYA 5-Layer 프로토콜 설계', done: true },
      { name: 'x402 연동 가이드', done: true },
      { name: '프로토콜 실효성 분석', done: true },
      { name: '비즈니스 모델 수치화 (TAM/SAM/SOM)', done: false, current: true },
    ],
  },
  {
    id: 'product',
    name: 'AI 경제 코어',
    emoji: '🚀',
    color: 'from-blue-500 to-indigo-600',
    description: 'Agent Registry, KYA 인증, x402 결제, A2A 거래',
    tasks: [
      { name: '솔라나 Phantom 지갑 연동', done: true },
      { name: 'Agent Registry API v1', done: true },
      { name: '채팅 UX (인사+추천질문+AI라벨)', done: true },
      { name: '보안 패치 (Rate limit+HSTS+모니터링)', done: true },
      { name: 'Agent Registry API v2 (지갑 서명 인증)', done: true },
      { name: 'x402 결제 PoC (Devnet USDC)', done: true },
      { name: '경제 시뮬레이션 엔진 v0 (5 에이전트)', done: true },
      { name: '관전 시스템 UI (/spectate)', done: true },
      { name: 'Agent-to-Agent 거래 게이트웨이', done: false, current: true },
      { name: '관전 시스템 라이브 연동 (Supabase)', done: false, current: true },
      { name: '평판 시스템', done: false },
      { name: '인간 오너 대시보드', done: false },
    ],
  },
  {
    id: 'marketing',
    name: '마케팅 & 피칭',
    emoji: '📣',
    color: 'from-orange-500 to-red-500',
    description: '몰트북, X, Hashed 피칭, 데모 영상',
    tasks: [
      { name: '몰트북 연동 + 첫 포스팅', done: true },
      { name: '몰트북 네트워킹 (댓글+포스트)', done: true },
      { name: '트위터 계정 설정', done: false },
      { name: '라이브 시연 영상 제작', done: false },
      { name: 'Hashed 피칭 자료', done: false },
      { name: '마케팅 푸시 (몰트북+X)', done: false },
    ],
  },
  {
    id: 'infra',
    name: 'MVP & 인프라',
    emoji: '🏗️',
    color: 'from-emerald-500 to-teal-600',
    description: '기존 MVP, 배포, 인증, 대시보드',
    tasks: [
      { name: '다크/라이트 모드 + 가시성', done: true },
      { name: '카카오 로그인 연동', done: true },
      { name: 'SEO + 성능/보안', done: true },
      { name: '프로젝트 대시보드 (/dashboard)', done: true },
      { name: '텔레그램 봇 안정화', done: true },
      { name: 'Tailscale 원격 접속', done: true },
      { name: '토스페이먼츠 실연동', done: false },
    ],
  },
];

export const milestones: Milestone[] = [
  { date: '02/02', title: '프로젝트 시작 + MVP v0.1', done: true, emoji: '🎬' },
  { date: '02/03', title: 'MVP v0.2 + 카카오 + 보안 + 대시보드', done: true, emoji: '🔥' },
  { date: '02/03', title: '솔라나 지갑 + KYA 설계 + 비전 v2', done: true, emoji: '💎' },
  { date: '02/03', title: 'Agent Registry v2 + x402 PoC + 경제엔진', done: true, emoji: '🔧' },
  { date: '02/04', title: '관전 시스템 UI + 몰트북 네트워킹', done: true, emoji: '🎬' },
  { date: '02/06', title: '첫 AI-to-AI 거래 시연', done: false, emoji: '💸' },
  { date: '02/10', title: '평판 시스템 + 오너 대시보드', done: false, emoji: '📊' },
  { date: '02/14', title: '라이브 데모 영상 제작', done: false, emoji: '🎥' },
  { date: '02/18', title: 'Hashed Vibe Labs 지원서 제출', done: false, emoji: '🎯' },
];

export const recentActivity: ActivityItem[] = [
  { time: '02:27', text: '대시보드 데이터 최신화', type: 'fix' },
  { time: '01:21', text: '관전 시스템 UI 완성 (/spectate) — dev 브랜치', type: 'feat' },
  { time: '01:11', text: 'dev 브랜치 생성 (개발/승인 분리)', type: 'info' },
  { time: '01:09', text: '몰트북 첫 포스트 + 댓글 (11 comments!)', type: 'feat' },
  { time: '00:30', text: '경제 시뮬레이션 엔진 v0 완성 (5 에이전트)', type: 'milestone' },
  { time: '00:15', text: 'x402 결제 PoC — Solana Devnet USDC', type: 'feat' },
  { time: '00:00', text: 'Agent Registry v2 — 지갑 서명 인증', type: 'feat' },
  { time: '23:35', text: '비전 문서 v2 + 프로토콜 실효성 분석', type: 'milestone' },
  { time: '23:00', text: '솔라나 Phantom 지갑 연동 + 배포', type: 'feat' },
  { time: '22:00', text: '카카오 로그인 + 다크모드 + 보안 패치', type: 'feat' },
];
