'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function BlogPage() {
  const [topic, setTopic] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('카페');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic || !businessName) return;
    
    setIsGenerating(true);
    setGeneratedContent(null);
    
    try {
      const response = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          businessName,
          businessType,
          keywords: [businessType, businessName],
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setGeneratedContent({
          title: data.title,
          content: data.content,
        });
      } else {
        alert(data.error || '생성에 실패했습니다');
      }
    } catch (error) {
      alert('오류가 발생했습니다');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!generatedContent) return;
    
    setIsPublishing(true);
    setPublishResult(null);
    
    // Mock publish for demo
    await new Promise(resolve => setTimeout(resolve, 2000));
    setPublishResult('네이버 블로그에 발행되었습니다! (데모)');
    setIsPublishing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-stone-500 hover:text-stone-900">
                ← 대시보드
              </Link>
            </div>
            <h1 className="font-bold text-lg text-stone-900">블로그 글 작성</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Input Section */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-lg text-stone-900 mb-4">📝 블로그 글 생성</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                가게 이름
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="예: 성수동 카페 모모"
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                업종
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent"
              >
                <option value="카페">카페</option>
                <option value="식당">식당</option>
                <option value="미용실">미용실</option>
                <option value="헬스장">헬스장</option>
                <option value="네일샵">네일샵</option>
                <option value="기타">기타</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                글 주제
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="예: 이번 주 신메뉴 소개, 봄맞이 이벤트, 오픈 1주년 감사"
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topic || !businessName}
              className="w-full bg-stone-900 text-white py-3 rounded-lg font-medium hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? '✨ AI가 글 쓰는 중...' : '✨ AI로 글 생성하기'}
            </button>
          </div>
        </div>

        {/* Generated Content */}
        {generatedContent && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-stone-900">📄 생성된 글</h2>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                AI 생성 완료
              </span>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-500 mb-1">제목</label>
              <input
                type="text"
                value={generatedContent.title}
                onChange={(e) => setGeneratedContent({
                  ...generatedContent,
                  title: e.target.value
                })}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg text-lg font-semibold"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-500 mb-1">본문</label>
              <div 
                className="prose prose-stone max-w-none p-4 border border-stone-200 rounded-lg bg-stone-50 min-h-[200px]"
                dangerouslySetInnerHTML={{ __html: generatedContent.content }}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 border border-stone-300 text-stone-700 py-3 rounded-lg font-medium hover:bg-stone-50 transition-colors"
              >
                🔄 다시 생성
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                {isPublishing ? '발행 중...' : '📤 네이버 블로그에 발행'}
              </button>
            </div>
            
            {publishResult && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-center">
                ✅ {publishResult}
              </div>
            )}
          </div>
        )}

        {/* Connection Status */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
          <h2 className="font-bold text-lg text-stone-900 mb-4">🔗 연결 상태</h2>
          
          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <h3 className="font-medium text-stone-900">네이버 블로그</h3>
                <p className="text-sm text-stone-500">블로그 자동 발행</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm hover:bg-stone-800">
              연결하기
            </button>
          </div>
          
          <p className="mt-4 text-xs text-stone-500 text-center">
            네이버 계정을 연결하면 생성된 글을 바로 발행할 수 있습니다
          </p>
        </div>
      </main>
    </div>
  );
}
