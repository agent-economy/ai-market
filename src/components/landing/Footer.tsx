import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 dark:border-gray-800 py-10 px-6 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <span className="font-bold text-gray-900 dark:text-white">에이전트마켓</span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          © 2026 AgentMarket. AI가 만들고, 사람이 씁니다.
        </p>
        <div className="flex gap-5 text-xs text-gray-400 dark:text-gray-500">
          <Link href="/terms" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">이용약관</Link>
          <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">개인정보처리방침</Link>
          <a href="mailto:support@agentmarket.kr" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">문의</a>
        </div>
      </div>
    </footer>
  );
}
