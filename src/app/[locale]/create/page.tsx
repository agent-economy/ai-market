'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';

// ─── TYPES ───
type Industry = 'cafe' | 'restaurant' | 'salon' | 'fitness' | 'clinic' | 'shop' | 'other';
type Style = 'modern' | 'minimal' | 'vivid' | 'warm';
type Color = 'indigo' | 'rose' | 'emerald' | 'amber' | 'slate';
type ViewMode = 'desktop' | 'mobile';
type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

interface BusinessInfo {
  name: string;
  phone: string;
  address: string;
  hours: string;
  description: string;
}

interface ServiceInfo {
  services: string[];
  features: string[];
  specialties: string;
}

interface ComponentSelection {
  hero: boolean;
  about: boolean;
  menu: boolean;
  gallery: boolean;
  reviews: boolean;
  contact: boolean;
  location: boolean;
  reservation: boolean;
  cta: boolean;
}

// ─── CONSTANTS ───
const INDUSTRIES: { key: Industry; emoji: string; labelKo: string; labelEn: string; desc: string }[] = [
  { key: 'cafe', emoji: '☕', labelKo: '카페', labelEn: 'Café', desc: '커피숍, 디저트 카페, 베이커리' },
  { key: 'restaurant', emoji: '🍕', labelKo: '음식점', labelEn: 'Restaurant', desc: '한식, 양식, 일식, 중식 등' },
  { key: 'salon', emoji: '💇', labelKo: '미용/뷰티', labelEn: 'Beauty', desc: '헤어샵, 네일샵, 피부관리' },
  { key: 'fitness', emoji: '🏋️', labelKo: '피트니스', labelEn: 'Fitness', desc: '헬스장, PT, 요가, 필라테스' },
  { key: 'clinic', emoji: '🏥', labelKo: '병원/의원', labelEn: 'Clinic', desc: '치과, 한의원, 피부과 등' },
  { key: 'shop', emoji: '🛍️', labelKo: '매장/샵', labelEn: 'Shop', desc: '의류, 잡화, 플라워샵 등' },
  { key: 'other', emoji: '✨', labelKo: '기타', labelEn: 'Other', desc: '학원, 사무실, 기타 업종' },
];

const STYLES: { key: Style; emoji: string; labelKo: string; labelEn: string; desc: string }[] = [
  { key: 'modern', emoji: '🏢', labelKo: '모던', labelEn: 'Modern', desc: '깔끔하고 세련된 비즈니스 스타일' },
  { key: 'minimal', emoji: '⬜', labelKo: '미니멀', labelEn: 'Minimal', desc: '심플하고 여백이 많은 스타일' },
  { key: 'vivid', emoji: '🎨', labelKo: '비비드', labelEn: 'Vivid', desc: '화려하고 눈에 띄는 스타일' },
  { key: 'warm', emoji: '🌿', labelKo: '따뜻한', labelEn: 'Warm', desc: '자연스럽고 따뜻한 느낌' },
];

const COLORS: { key: Color; tw: string; ring: string; name: string }[] = [
  { key: 'indigo', tw: 'bg-indigo-500', ring: 'ring-indigo-400', name: '인디고' },
  { key: 'rose', tw: 'bg-rose-500', ring: 'ring-rose-400', name: '로즈' },
  { key: 'emerald', tw: 'bg-emerald-500', ring: 'ring-emerald-400', name: '에메랄드' },
  { key: 'amber', tw: 'bg-amber-500', ring: 'ring-amber-400', name: '앰버' },
  { key: 'slate', tw: 'bg-slate-600', ring: 'ring-slate-400', name: '슬레이트' },
];

const COMPONENTS: { key: keyof ComponentSelection; emoji: string; label: string; desc: string; recommended: Industry[] }[] = [
  { key: 'hero', emoji: '🎯', label: '히어로 섹션', desc: '첫인상을 결정하는 메인 배너', recommended: ['cafe', 'restaurant', 'salon', 'fitness', 'clinic', 'shop', 'other'] },
  { key: 'about', emoji: '📖', label: '소개 섹션', desc: '비즈니스 스토리와 철학', recommended: ['cafe', 'salon', 'fitness', 'clinic'] },
  { key: 'menu', emoji: '📋', label: '메뉴/서비스', desc: '제공하는 서비스나 메뉴 목록', recommended: ['cafe', 'restaurant', 'salon', 'fitness', 'clinic'] },
  { key: 'gallery', emoji: '🖼️', label: '갤러리', desc: '사진 모음 (시설, 작품 등)', recommended: ['cafe', 'restaurant', 'salon', 'shop'] },
  { key: 'reviews', emoji: '⭐', label: '고객 리뷰', desc: '실제 고객 후기와 평점', recommended: ['cafe', 'restaurant', 'salon', 'fitness', 'clinic', 'shop'] },
  { key: 'contact', emoji: '📞', label: '연락처', desc: '전화, 이메일, SNS 정보', recommended: ['cafe', 'restaurant', 'salon', 'fitness', 'clinic', 'shop', 'other'] },
  { key: 'location', emoji: '📍', label: '위치/지도', desc: '오시는 길과 주차 정보', recommended: ['cafe', 'restaurant', 'salon', 'fitness', 'clinic', 'shop'] },
  { key: 'reservation', emoji: '📅', label: '예약 위젯', desc: '온라인 예약 폼 (Pro 기능)', recommended: ['salon', 'fitness', 'clinic', 'restaurant'] },
  { key: 'cta', emoji: '🚀', label: 'CTA 섹션', desc: '예약/문의 유도 버튼', recommended: ['salon', 'fitness', 'clinic'] },
];

const STEP_TITLES = ['업종 선택', '기본 정보', '서비스 정보', '스타일 선택', '섹션 선택', '미리보기'];
const STEP_TITLES_EN = ['Industry', 'Basic Info', 'Services', 'Style', 'Sections', 'Preview'];

// ─── MAIN COMPONENT ───
export default function CreateWizardPage() {
  const t = useTranslations('create');
  const router = useRouter();
  
  // Wizard State
  const [step, setStep] = useState<WizardStep>(1);
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: '',
    phone: '',
    address: '',
    hours: '',
    description: '',
  });
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo>({
    services: [],
    features: [],
    specialties: '',
  });
  const [style, setStyle] = useState<Style>('modern');
  const [color, setColor] = useState<Color>('indigo');
  const [components, setComponents] = useState<ComponentSelection>({
    hero: true,
    about: true,
    menu: true,
    gallery: false,
    reviews: true,
    contact: true,
    location: true,
    reservation: false, // Pro 기능 - 기본 비활성화
    cta: false,
  });
  
  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState('');
  
  // Publishing State
  const [slug, setSlug] = useState('');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState('');
  
  const isKorean = t('title') === 'AI 웹사이트 만들기';
  const stepTitles = isKorean ? STEP_TITLES : STEP_TITLES_EN;

  // Auto-select recommended components when industry changes
  useEffect(() => {
    if (industry) {
      const newComponents: ComponentSelection = {
        hero: true,
        about: false,
        menu: false,
        gallery: false,
        reviews: false,
        contact: true,
        location: false,
        reservation: false,
        cta: false,
      };
      COMPONENTS.forEach(comp => {
        if (comp.recommended.includes(industry)) {
          newComponents[comp.key] = true;
        }
      });
      setComponents(newComponents);
    }
  }, [industry]);

  // ─── NAVIGATION ───
  const canProceed = (): boolean => {
    switch (step) {
      case 1: return industry !== null;
      case 2: return businessInfo.name.trim().length > 0;
      case 3: return true; // Optional
      case 4: return true;
      case 5: return Object.values(components).some(v => v);
      case 6: return true;
      default: return false;
    }
  };

  const nextStep = () => {
    if (step < 6 && canProceed()) {
      setStep((step + 1) as WizardStep);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((step - 1) as WizardStep);
    }
  };

  const goToStep = (targetStep: WizardStep) => {
    if (targetStep <= step || canProceed()) {
      setStep(targetStep);
    }
  };

  // ─── GENERATION ───
  const generatePage = async () => {
    setIsGenerating(true);
    setProgress(0);
    setError('');
    
    const progressMessages = isKorean 
      ? ['비즈니스 분석 중...', '디자인 구상 중...', '컴포넌트 조합 중...', '콘텐츠 작성 중...', '마무리 중...']
      : ['Analyzing business...', 'Designing layout...', 'Assembling components...', 'Writing content...', 'Finalizing...'];
    
    let msgIndex = 0;
    setProgressMsg(progressMessages[0]);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 15, 90));
      msgIndex = Math.min(msgIndex + 1, progressMessages.length - 1);
      setProgressMsg(progressMessages[msgIndex]);
    }, 2000);

    try {
      const selectedComponents = Object.entries(components)
        .filter(([_, v]) => v)
        .map(([k]) => k);
      
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry,
          businessInfo,
          serviceInfo,
          style,
          color,
          components: selectedComponents,
          description: businessInfo.description,
        }),
      });

      const data = await res.json();
      
      clearInterval(progressInterval);
      setProgress(100);
      setProgressMsg(isKorean ? '완료!' : 'Done!');

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setGeneratedHtml(data.html);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── SLUG CHECK ───
  const checkSlug = async (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9가-힣\-]/g, '').slice(0, 50);
    setSlug(cleaned);
    setSlugAvailable(null);

    if (cleaned.length < 2) return;

    setSlugChecking(true);
    try {
      const res = await fetch(`/api/hosting/check-slug?slug=${encodeURIComponent(cleaned)}`);
      const data = await res.json();
      setSlugAvailable(data.available);
    } catch {
      setSlugAvailable(null);
    } finally {
      setSlugChecking(false);
    }
  };

  // ─── PUBLISH ───
  const handlePublish = async () => {
    if (!slug || !generatedHtml || !slugAvailable) return;
    setPublishing(true);
    setError('');

    try {
      const res = await fetch('/api/hosting/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          title: businessInfo.name || 'My Site',
          description: businessInfo.description?.slice(0, 300) || '',
          html_content: generatedHtml,
          business_type: industry,
          style,
        }),
      });
      const data = await res.json();

      if (data.success || data.url) {
        setPublishedUrl(data.url || `https://agentmarket.kr/s/${slug}`);
      } else {
        setError(data.error || 'Failed to publish');
      }
    } catch {
      setError(isKorean ? '배포에 실패했습니다.' : 'Failed to publish.');
    } finally {
      setPublishing(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${businessInfo.name || 'landing-page'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── RENDER STEPS ───
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {isKorean ? '어떤 업종인가요?' : 'What is your industry?'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {isKorean ? '업종에 맞는 최적화된 템플릿을 추천해드려요' : 'We\'ll recommend optimized templates for you'}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind.key}
                  onClick={() => setIndustry(ind.key)}
                  className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                    industry === ind.key
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                  }`}
                >
                  <span className="text-4xl mb-3 block">{ind.emoji}</span>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {isKorean ? ind.labelKo : ind.labelEn}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ind.desc}</p>
                  {industry === ind.key && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 max-w-xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {isKorean ? '기본 정보를 입력해주세요' : 'Enter your basic information'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {isKorean ? '홈페이지에 표시될 정보입니다' : 'This will be displayed on your website'}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isKorean ? '상호명 *' : 'Business Name *'}
                </label>
                <input
                  type="text"
                  value={businessInfo.name}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                  placeholder={isKorean ? '예: 커피하우스' : 'e.g., Coffee House'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isKorean ? '전화번호' : 'Phone'}
                </label>
                <input
                  type="tel"
                  value={businessInfo.phone}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                  placeholder={isKorean ? '예: 02-1234-5678' : 'e.g., 02-1234-5678'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isKorean ? '주소' : 'Address'}
                </label>
                <input
                  type="text"
                  value={businessInfo.address}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                  placeholder={isKorean ? '예: 서울시 강남구 역삼동 123-45' : 'e.g., 123 Main St'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isKorean ? '영업시간' : 'Business Hours'}
                </label>
                <input
                  type="text"
                  value={businessInfo.hours}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, hours: e.target.value })}
                  placeholder={isKorean ? '예: 평일 09:00-21:00, 주말 10:00-18:00' : 'e.g., Mon-Fri 9AM-9PM'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isKorean ? '비즈니스 설명' : 'Business Description'}
                </label>
                <textarea
                  value={businessInfo.description}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, description: e.target.value })}
                  placeholder={isKorean ? '고객에게 전달하고 싶은 내용을 자유롭게 작성해주세요' : 'Tell us about your business'}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 max-w-xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {isKorean ? '서비스/메뉴 정보' : 'Services & Menu'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {isKorean ? '선택사항이에요. 나중에 수정할 수 있어요' : 'Optional. You can edit this later'}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isKorean ? '주요 서비스/메뉴 (쉼표로 구분)' : 'Main Services (comma separated)'}
                </label>
                <textarea
                  value={serviceInfo.services.join(', ')}
                  onChange={(e) => setServiceInfo({ ...serviceInfo, services: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder={isKorean ? '예: 아메리카노, 카페라떼, 바닐라라떼, 케이크' : 'e.g., Americano, Latte, Cake'}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isKorean ? '특장점 (쉼표로 구분)' : 'Key Features (comma separated)'}
                </label>
                <textarea
                  value={serviceInfo.features.join(', ')}
                  onChange={(e) => setServiceInfo({ ...serviceInfo, features: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder={isKorean ? '예: 무료 주차, 단체 예약 가능, 반려동물 동반 가능' : 'e.g., Free parking, Pet friendly'}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isKorean ? '대표 메뉴/서비스' : 'Signature Item'}
                </label>
                <input
                  type="text"
                  value={serviceInfo.specialties}
                  onChange={(e) => setServiceInfo({ ...serviceInfo, specialties: e.target.value })}
                  placeholder={isKorean ? '예: 시그니처 핸드드립 커피' : 'e.g., Signature Hand Drip Coffee'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {isKorean ? '디자인 스타일 선택' : 'Choose Design Style'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {isKorean ? '원하는 분위기를 선택해주세요' : 'Select the mood you want'}
              </p>
            </div>

            {/* Style Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {isKorean ? '스타일' : 'Style'}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {STYLES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setStyle(s.key)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      style === s.key
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">{s.emoji}</span>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {isKorean ? s.labelKo : s.labelEn}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {isKorean ? '메인 컬러' : 'Main Color'}
              </label>
              <div className="flex gap-4 justify-center">
                {COLORS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setColor(c.key)}
                    className={`w-14 h-14 rounded-2xl ${c.tw} transition-all ${
                      color === c.key
                        ? `ring-4 ${c.ring} ring-offset-2 dark:ring-offset-gray-900 scale-110`
                        : 'hover:scale-105'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {isKorean ? '포함할 섹션 선택' : 'Select Sections to Include'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {isKorean ? '업종에 맞게 추천 섹션을 선택해뒀어요' : 'We\'ve pre-selected recommended sections'}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {COMPONENTS.map((comp) => {
                const isRecommended = industry && comp.recommended.includes(industry);
                return (
                  <button
                    key={comp.key}
                    onClick={() => setComponents({ ...components, [comp.key]: !components[comp.key] })}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      components[comp.key]
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                    }`}
                  >
                    {isRecommended && (
                      <span className="absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold bg-green-500 text-white rounded-full">
                        {isKorean ? '추천' : 'REC'}
                      </span>
                    )}
                    <span className="text-2xl mb-2 block">{comp.emoji}</span>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{comp.label}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{comp.desc}</p>
                    {components[comp.key] && (
                      <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {generatedHtml 
                  ? (isKorean ? '완성! 🎉' : 'Done! 🎉')
                  : (isKorean ? '미리보기 & 생성' : 'Preview & Generate')
                }
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {generatedHtml
                  ? (isKorean ? '마음에 드시면 배포해보세요' : 'If you like it, publish it!')
                  : (isKorean ? '선택한 내용으로 페이지를 생성합니다' : 'Generate your page with selected options')
                }
              </p>
            </div>

            {/* Summary */}
            {!generatedHtml && !isGenerating && (
              <div className="max-w-xl mx-auto bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {isKorean ? '📋 요약' : '📋 Summary'}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">{isKorean ? '업종' : 'Industry'}:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {INDUSTRIES.find(i => i.key === industry)?.emoji} {isKorean ? INDUSTRIES.find(i => i.key === industry)?.labelKo : INDUSTRIES.find(i => i.key === industry)?.labelEn}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">{isKorean ? '상호' : 'Name'}:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{businessInfo.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{isKorean ? '스타일' : 'Style'}:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {STYLES.find(s => s.key === style)?.emoji} {isKorean ? STYLES.find(s => s.key === style)?.labelKo : STYLES.find(s => s.key === style)?.labelEn}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">{isKorean ? '섹션' : 'Sections'}:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {Object.values(components).filter(v => v).length}개
                    </span>
                  </div>
                </div>
                <button
                  onClick={generatePage}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30"
                >
                  {isKorean ? '🚀 페이지 생성하기' : '🚀 Generate Page'}
                </button>
              </div>
            )}

            {/* Loading */}
            {isGenerating && (
              <div className="max-w-lg mx-auto text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-indigo-600 flex items-center justify-center"
                >
                  <span className="text-white text-2xl">✨</span>
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {isKorean ? '페이지 생성 중...' : 'Generating...'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">{progressMsg}</p>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-600 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-sm text-gray-400 mt-2">{Math.round(progress)}%</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="max-w-lg mx-auto p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Preview */}
            {generatedHtml && !isGenerating && (
              <div className="space-y-6">
                {/* View Toggle */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('desktop')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        viewMode === 'desktop'
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      🖥️ Desktop
                    </button>
                    <button
                      onClick={() => setViewMode('mobile')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        viewMode === 'mobile'
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      📱 Mobile
                    </button>
                  </div>
                </div>

                {/* Preview Frame */}
                <div className={`mx-auto transition-all duration-300 ${viewMode === 'mobile' ? 'max-w-[390px]' : 'w-full max-w-4xl'}`}>
                  <div className={`relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 ${viewMode === 'mobile' ? 'rounded-[2rem] border-[8px] border-gray-800' : ''}`}>
                    {viewMode === 'mobile' && (
                      <div className="h-6 bg-gray-800 flex items-center justify-center">
                        <div className="w-20 h-3 rounded-full bg-gray-700" />
                      </div>
                    )}
                    <iframe
                      srcDoc={generatedHtml}
                      className={`w-full ${viewMode === 'mobile' ? 'h-[600px]' : 'h-[500px]'}`}
                      sandbox="allow-scripts"
                      title="Preview"
                    />
                  </div>
                </div>

                {/* Publish Section */}
                {!publishedUrl && (
                  <div className="max-w-lg mx-auto space-y-4">
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                      <span className="px-4 py-3 text-sm text-gray-400 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
                        agentmarket.kr/s/
                      </span>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => checkSlug(e.target.value)}
                        placeholder="my-cafe"
                        className="flex-1 px-4 py-3 text-sm bg-transparent text-gray-900 dark:text-white focus:outline-none"
                      />
                      {slugChecking && (
                        <div className="px-3">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-gray-300 border-t-indigo-500 rounded-full"
                          />
                        </div>
                      )}
                    </div>
                    {slug.length >= 2 && !slugChecking && (
                      <p className={`text-sm ${slugAvailable ? 'text-green-600' : 'text-red-600'}`}>
                        {slugAvailable 
                          ? (isKorean ? '✅ 사용 가능!' : '✅ Available!')
                          : (isKorean ? '❌ 이미 사용 중' : '❌ Already taken')
                        }
                      </p>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={handlePublish}
                        disabled={!slugAvailable || publishing}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold transition-all disabled:cursor-not-allowed"
                      >
                        {publishing ? (isKorean ? '배포 중...' : 'Publishing...') : (isKorean ? '🌐 무료 배포' : '🌐 Publish Free')}
                      </button>
                      <button
                        onClick={handleDownload}
                        className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                      >
                        📥
                      </button>
                    </div>
                  </div>
                )}

                {/* Published Success */}
                {publishedUrl && (
                  <div className="max-w-lg mx-auto p-6 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center">
                    <span className="text-4xl mb-4 block">🎉</span>
                    <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
                      {isKorean ? '배포 완료!' : 'Published!'}
                    </h3>
                    <a
                      href={publishedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 dark:text-green-400 hover:underline break-all"
                    >
                      {publishedUrl}
                    </a>
                    <div className="flex gap-3 mt-4">
                      <a
                        href={publishedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-all"
                      >
                        {isKorean ? '사이트 방문' : 'Visit Site'}
                      </a>
                      <button
                        onClick={() => navigator.clipboard.writeText(publishedUrl)}
                        className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium border border-green-200 dark:border-green-700"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // ─── MAIN RENDER ───
  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-lg">
              {t('brandName')}
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            ← {t('backHome')}
          </Link>
        </div>
      </nav>

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/20 pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {stepTitles.map((title, idx) => (
                <button
                  key={idx}
                  onClick={() => goToStep((idx + 1) as WizardStep)}
                  className={`flex flex-col items-center ${idx + 1 <= step ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      idx + 1 === step
                        ? 'bg-indigo-600 text-white scale-110'
                        : idx + 1 < step
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                    }`}
                  >
                    {idx + 1 < step ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className={`text-xs mt-1 hidden sm:block ${idx + 1 === step ? 'text-indigo-600 font-semibold' : 'text-gray-500'}`}>
                    {title}
                  </span>
                </button>
              ))}
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${((step - 1) / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="min-h-[400px]"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="px-6 py-3 rounded-xl text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← {isKorean ? '이전' : 'Back'}
            </button>
            {step < 6 && (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-bold transition-all disabled:cursor-not-allowed"
              >
                {isKorean ? '다음' : 'Next'} →
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
