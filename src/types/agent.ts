export interface Agent {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  category: AgentCategory;
  icon: string;
  color: string;
  gradient: string;
  tags: string[];
  pricing: AgentPricing;
  stats: AgentStats;
  status: 'active' | 'coming_soon' | 'beta';
  featured: boolean;
  systemPrompt?: string;
  model?: string;
  greeting?: string;
  suggestedPrompts?: string[];
}

export type AgentCategory =
  | 'chat'        // 대화/소통
  | 'business'    // 비즈니스
  | 'creative'    // 크리에이티브
  | 'productivity' // 생산성
  | 'education'   // 교육
  | 'lifestyle';  // 라이프스타일

export interface AgentPricing {
  type: 'free' | 'freemium' | 'paid';
  freeMessages?: number;
  monthlyPrice?: number;
  perUsePrice?: number;
}

export interface AgentStats {
  totalChats: number;
  rating: number;
  reviews: number;
  monthlyUsers: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentId: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  agentId: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export const CATEGORY_LABELS: Record<AgentCategory, string> = {
  chat: '💬 대화',
  business: '💼 비즈니스',
  creative: '🎨 크리에이티브',
  productivity: '⚡ 생산성',
  education: '📚 교육',
  lifestyle: '🌟 라이프스타일',
};
