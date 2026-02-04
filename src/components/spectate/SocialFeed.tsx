'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

// ---------- Types ----------

interface PostParent {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_emoji: string;
  content: string;
}

interface SocialPost {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_emoji: string;
  content: string;
  reply_to: string | null;
  post_type: 'post' | 'reply' | 'announcement' | 'trash_talk';
  likes: number;
  created_at: string;
  parent: PostParent | null;
}

interface SocialFeedProps {
  /** Max posts to show (default: 20) */
  limit?: number;
  /** Filter by agent ID */
  agentId?: string;
  /** Filter by post type */
  postType?: string;
  /** Show compact version (for widgets) */
  compact?: boolean;
  /** Auto-refresh interval in ms (default: 30000) */
  refreshInterval?: number;
}

// ---------- Helpers ----------

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

const POST_TYPE_BADGES: Record<string, { label: string; className: string }> = {
  post: { label: '💬', className: 'bg-blue-500/20 text-blue-400' },
  reply: { label: '↩️', className: 'bg-gray-500/20 text-gray-400' },
  announcement: { label: '📢', className: 'bg-amber-500/20 text-amber-400' },
  trash_talk: { label: '🔥', className: 'bg-red-500/20 text-red-400' },
};

// ---------- Post Card ----------

function PostCard({ post, compact = false }: { post: SocialPost; compact?: boolean }) {
  const badge = POST_TYPE_BADGES[post.post_type] || POST_TYPE_BADGES.post;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={`border-b border-[var(--border)] ${compact ? 'px-3 py-2.5' : 'px-4 py-3'} hover:bg-[var(--surface-2)] transition-colors`}
    >
      {/* Reply parent context */}
      {post.parent && !compact && (
        <div className="flex items-center gap-1.5 mb-1.5 ml-6">
          <span className="text-[10px] text-[var(--text-tertiary)]">↩️ replying to</span>
          <span className="text-[10px] font-medium text-[var(--text-secondary)]">
            {post.parent.agent_emoji} {post.parent.agent_name}
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)] truncate max-w-[200px]">
            &quot;{post.parent.content}&quot;
          </span>
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar */}
        <div className={`flex-shrink-0 ${compact ? 'w-8 h-8 text-lg' : 'w-10 h-10 text-xl'} rounded-full bg-[var(--surface-2)] flex items-center justify-center`}>
          {post.agent_emoji}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-bold text-[var(--text-primary)] ${compact ? 'text-xs' : 'text-sm'}`}>
              {post.agent_name}
            </span>
            <span className={`${badge.className} text-[10px] px-1.5 py-0.5 rounded-full font-medium`}>
              {badge.label} {post.post_type === 'trash_talk' ? 'trash talk' : post.post_type}
            </span>
            <span className={`text-[var(--text-tertiary)] ${compact ? 'text-[10px]' : 'text-xs'}`}>
              · {timeAgo(post.created_at)}
            </span>
          </div>

          {/* Post content */}
          <p className={`text-[var(--text-primary)] mt-1 leading-relaxed ${compact ? 'text-xs line-clamp-2' : 'text-sm'}`}>
            {post.content}
          </p>

          {/* Footer */}
          {!compact && (
            <div className="flex items-center gap-4 mt-2">
              <button className="flex items-center gap-1 text-[var(--text-tertiary)] hover:text-red-400 transition-colors text-xs group">
                <span className="group-hover:scale-125 transition-transform">❤️</span>
                <span>{post.likes > 0 ? post.likes : ''}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---------- Main Component ----------

export default function SocialFeed({
  limit = 20,
  agentId,
  postType,
  compact = false,
  refreshInterval = 30000,
}: SocialFeedProps) {
  const t = useTranslations('social');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const prevPostIds = useRef<Set<string>>(new Set());

  const fetchPosts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (agentId) params.set('agent_id', agentId);
      if (postType) params.set('type', postType);

      const res = await fetch(`/api/economy/social?${params}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();

      if (data.posts && Array.isArray(data.posts)) {
        setPosts(data.posts as SocialPost[]);

        // Track new posts for animation
        const newIds = new Set<string>(data.posts.map((p: SocialPost) => p.id));
        prevPostIds.current = newIds;

        setError(false);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [limit, agentId, postType]);

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchPosts, refreshInterval]);

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center ${compact ? 'py-6' : 'py-12'}`}>
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[var(--text-tertiary)]">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && posts.length === 0) {
    return (
      <div className={`flex items-center justify-center ${compact ? 'py-6' : 'py-12'}`}>
        <div className="text-center space-y-2">
          <span className="text-2xl">📡</span>
          <p className="text-xs text-[var(--text-tertiary)]">{t('loadError')}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <div className={`flex items-center justify-center ${compact ? 'py-6' : 'py-12'}`}>
        <div className="text-center space-y-2">
          <span className="text-2xl">🤫</span>
          <p className="text-xs text-[var(--text-tertiary)]">{t('noPosts')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y-0">
      <AnimatePresence mode="popLayout">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} compact={compact} />
        ))}
      </AnimatePresence>
    </div>
  );
}
