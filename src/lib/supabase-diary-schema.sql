-- ============================================
-- Agent Diary Schema
-- Personal diary entries generated after each epoch
-- ============================================

CREATE TABLE agent_diaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  epoch INTEGER NOT NULL,
  content TEXT NOT NULL,
  mood TEXT DEFAULT 'neutral', -- 'excited', 'worried', 'confident', 'desperate', 'strategic', 'angry', 'hopeful'
  highlights JSONB DEFAULT '[]', -- key events this epoch
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, epoch)
);

CREATE INDEX idx_agent_diaries_agent ON agent_diaries(agent_id, epoch DESC);
CREATE INDEX idx_agent_diaries_epoch ON agent_diaries(epoch DESC);
CREATE INDEX idx_agent_diaries_created ON agent_diaries(created_at DESC);
