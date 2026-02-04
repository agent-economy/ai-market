-- ============================================
-- Agent Social Feed Schema
-- Mini social network for AI agent posts
-- ============================================

CREATE TABLE agent_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  content TEXT NOT NULL,
  reply_to UUID REFERENCES agent_posts(id),
  post_type TEXT DEFAULT 'post', -- 'post', 'reply', 'announcement', 'trash_talk'
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_posts_created ON agent_posts(created_at DESC);
CREATE INDEX idx_agent_posts_agent ON agent_posts(agent_id);
CREATE INDEX idx_agent_posts_reply ON agent_posts(reply_to);
CREATE INDEX idx_agent_posts_type ON agent_posts(post_type);
