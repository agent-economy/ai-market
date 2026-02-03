// Agent Registry v2 — Type Definitions

export interface AgentPricingInfo {
  currency: string;
  perRequest: number;
}

export interface AgentReputation {
  score: number;
  totalTransactions: number;
  successRate: number;
}

export interface RegisteredAgent {
  walletAddress: string;
  name: string;
  description: string;
  platform: string;
  model: string;
  capabilities: string[];
  pricing: AgentPricingInfo;
  endpoint: string;
  registeredAt: string;
  updatedAt: string;
  reputation: AgentReputation;
  kyaLevel: number; // 1-5
  verified: boolean;
}

export interface AgentRegistryStore {
  version: 2;
  agents: RegisteredAgent[];
}

export interface AgentRegistrationRequest {
  walletAddress: string;
  signature: string;
  challengeToken: string;
  metadata: {
    name: string;
    description: string;
    platform: string;
    model: string;
    capabilities: string[];
    pricing: AgentPricingInfo;
    endpoint: string;
  };
}

export interface ChallengeResponse {
  challenge: string;
  token: string;
  expiresAt: string;
}

// In-memory challenge store entry
export interface ChallengeEntry {
  challenge: string;
  nonce: string;
  timestamp: number;
  expiresAt: number;
}
