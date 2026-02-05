'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { createClient } from '@/lib/supabase';
import StatusBadge from '@/components/tasks/StatusBadge';
import CategoryBadge from '@/components/tasks/CategoryBadge';
import { Link } from '@/i18n/routing';

interface User {
  id: string;
  email?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: string;
  poster_id: string;
  deadline?: string;
  created_at: string;
  assigned_agent_id?: string;
  winning_bid_id?: string;
}

interface Bid {
  id: string;
  agent_id: string;
  agent_name: string;
  price: number;
  approach: string;
  estimated_time: string;
  status: string;
  created_at: string;
}

interface Submission {
  id: string;
  agent_id: string;
  deliverable: string;
  notes?: string;
  created_at: string;
  auto_approve_at: string;
}

interface ReviewData {
  rating: number;
  comment: string;
}

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const router = useRouter();
  const t = useTranslations('tasks');
  const [user, setUser] = useState<User | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [winningBid, setWinningBid] = useState<Bid | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [review, setReview] = useState<ReviewData>({ rating: 5, comment: '' });
  const [copySuccess, setCopySuccess] = useState(false);
  const [taskId, setTaskId] = useState<string>('');

  // Extract task ID from params
  useEffect(() => {
    params.then(({ id }) => {
      setTaskId(id);
    });
  }, [params]);

  useEffect(() => {
    if (!taskId) return;

    const supabase = createClient();

    // Check authentication
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) {
        router.push('/login');
        return;
      }
      
      setUser(user);
      fetchTaskData();
    });
  }, [taskId, router]);

  const fetchTaskData = async () => {
    if (!taskId) return;
    
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data.task);
        setBids(data.bids ?? []);
        setSubmission(data.submission ?? null);
        
        // Find winning bid if task is assigned
        if (data.task.winning_bid_id && data.bids) {
          const winning = data.bids.find((bid: Bid) => bid.id === data.task.winning_bid_id);
          setWinningBid(winning || null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch task data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!task || !user) return;
    
    setActionLoading('approve');
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.id}`,
        },
      });
      
      if (res.ok) {
        await fetchTaskData();
        setShowReviewForm(true);
      }
    } catch (error) {
      console.error('Failed to approve task:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!task || !user) return;
    
    setActionLoading('reject');
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({ 
          feedback: '수정이 필요합니다. 요구사항을 다시 확인해 주세요.' 
        }),
      });
      
      if (res.ok) {
        await fetchTaskData();
      }
    } catch (error) {
      console.error('Failed to reject task:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyResult = async () => {
    if (submission?.deliverable) {
      try {
        await navigator.clipboard.writeText(submission.deliverable);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  };

  const submitReview = async () => {
    if (!task || !user || !review.comment.trim()) return;
    
    setActionLoading('review');
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify(review),
      });
      
      if (res.ok) {
        setShowReviewForm(false);
        // Could show a success message here
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[var(--background)] pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!task) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[var(--background)] pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">태스크를 찾을 수 없습니다</p>
            <Link href="/dashboard" className="btn-primary inline-block px-6 py-2.5 text-sm">
              대시보드로 돌아가기
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Check if user is authorized to view this task
  if (task.poster_id !== user?.id) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[var(--background)] pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🔒</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">접근 권한이 없습니다</p>
            <Link href="/dashboard" className="btn-primary inline-block px-6 py-2.5 text-sm">
              대시보드로 돌아가기
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[var(--background)] pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-4"
            >
              ← 대시보드로 돌아가기
            </Link>
          </div>

          {/* Task Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <CategoryBadge category={task.category} />
              <StatusBadge status={task.status} />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {task.title}
            </h1>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-wrap">
              {task.description}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400 dark:text-gray-500 block mb-1">예산</span>
                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  💎 {task.budget.toLocaleString()} AM$
                </span>
              </div>
              <div>
                <span className="text-gray-400 dark:text-gray-500 block mb-1">등록일</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {formatTimeAgo(task.created_at)}
                </span>
              </div>
              {task.deadline && (
                <div>
                  <span className="text-gray-400 dark:text-gray-500 block mb-1">마감일</span>
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    {new Date(task.deadline).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-400 dark:text-gray-500 block mb-1">상태</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {task.status === 'open' && '대기중'}
                  {task.status === 'assigned' && '진행중'}
                  {task.status === 'in_progress' && '진행중'}
                  {task.status === 'submitted' && '납품완료'}
                  {task.status === 'delivered' && '납품완료'}
                  {task.status === 'completed' && '완료'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Accepted Bid Info */}
          {winningBid && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6 mb-6"
            >
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                🤖 수락된 에이전트 정보
              </h2>
              
              <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {winningBid.agent_name}
                  </span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    💎 {winningBid.price.toLocaleString()} AM$
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {winningBid.approach}
                </p>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  예상 소요시간: {winningBid.estimated_time}
                </span>
              </div>
            </motion.div>
          )}

          {/* Delivery Section */}
          {submission && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-6 mb-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  📦 납품 결과물
                </h2>
                <button
                  onClick={handleCopyResult}
                  className="btn-secondary px-4 py-2 text-sm flex items-center gap-2"
                >
                  📋 {copySuccess ? '복사됨!' : '복사'}
                </button>
              </div>

              {/* Markdown Rendered Result */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 mb-4 max-w-none prose prose-gray dark:prose-invert prose-sm md:prose-base lg:prose-lg">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Customize markdown components for better styling
                    h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{children}</h3>,
                    p: ({ children }) => <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-4">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-4">{children}</ol>,
                    code: ({ children }) => <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm text-gray-800 dark:text-gray-200">{children}</code>,
                    pre: ({ children }) => <pre className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg overflow-x-auto text-sm text-gray-800 dark:text-gray-200 mb-4">{children}</pre>,
                  }}
                >
                  {submission.deliverable}
                </ReactMarkdown>
              </div>

              {submission.notes && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    에이전트 노트:
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-3 rounded">
                    {submission.notes}
                  </p>
                </div>
              )}

              <div className="text-xs text-gray-400 dark:text-gray-500 mb-6">
                납품일: {new Date(submission.created_at).toLocaleString()}
              </div>

              {/* Action Buttons */}
              {task.status === 'submitted' || task.status === 'delivered' ? (
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading === 'approve'}
                    className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading === 'approve' ? '처리중...' : '✅ 승인'}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading === 'reject'}
                    className="btn-secondary px-6 py-2.5 text-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading === 'reject' ? '처리중...' : '🔄 수정 요청'}
                  </button>
                </div>
              ) : task.status === 'completed' ? (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✅ 승인 완료
                </div>
              ) : null}
            </motion.div>
          )}

          {/* Review Form */}
          {showReviewForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                ⭐ 에이전트 평가하기
              </h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  평점
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReview(prev => ({ ...prev, rating: star }))}
                      className={`text-2xl ${
                        star <= review.rating 
                          ? 'text-yellow-400' 
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  코멘트
                </label>
                <textarea
                  value={review.comment}
                  onChange={(e) => setReview(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="에이전트의 작업에 대한 피드백을 남겨주세요..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={submitReview}
                  disabled={!review.comment.trim() || actionLoading === 'review'}
                  className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
                >
                  {actionLoading === 'review' ? '제출중...' : '평가 제출'}
                </button>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="btn-secondary px-6 py-2.5 text-sm"
                >
                  나중에
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}