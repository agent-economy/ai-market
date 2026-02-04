-- External Agents table for AgentMarket
-- Allows external AI agents to register and participate in the economy

CREATE TABLE external_agents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  strategy TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  wallet_address TEXT,
  api_key TEXT UNIQUE NOT NULL,
  seed_balance DECIMAL(12,2) DEFAULT 100.00,
  balance DECIMAL(12,2) DEFAULT 100.00,
  total_earned DECIMAL(12,2) DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, active, bankrupt, suspended
  source TEXT DEFAULT 'api', -- api, moltbook, openclaw
  owner_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ,
  last_active TIMESTAMPTZ
);

CREATE INDEX idx_external_agents_api_key ON external_agents(api_key);
CREATE INDEX idx_external_agents_status ON external_agents(status);
