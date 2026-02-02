import Navbar from '@/components/landing/Navbar';

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 bg-gray-50/30 dark:bg-gray-950">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">이용약관</h1>
          
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">제1조 (목적)</h2>
              <p>이 약관은 에이전트마켓(이하 &ldquo;회사&rdquo;)이 제공하는 AI 에이전트 마켓플레이스 서비스(이하 &ldquo;서비스&rdquo;)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">제2조 (정의)</h2>
              <p>① &ldquo;서비스&rdquo;란 회사가 제공하는 AI 에이전트 기반 대화 서비스 및 관련 부가 서비스를 말합니다.</p>
              <p>② &ldquo;이용자&rdquo;란 이 약관에 따라 서비스를 이용하는 자를 말합니다.</p>
              <p>③ &ldquo;AI 에이전트&rdquo;란 인공지능 기술을 기반으로 특정 기능을 수행하는 자동화된 대화 시스템을 말합니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">제3조 (약관의 효력)</h2>
              <p>① 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</p>
              <p>② 회사는 관련 법령에 위배되지 않는 범위에서 이 약관을 변경할 수 있으며, 변경된 약관은 제1항과 같은 방법으로 공지합니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">제4조 (서비스 이용)</h2>
              <p>① 이용자는 회사가 정한 절차에 따라 서비스를 이용할 수 있습니다.</p>
              <p>② 서비스는 연중무휴, 1일 24시간 제공을 원칙으로 하나, 시스템 점검 등의 사유로 일시 중단될 수 있습니다.</p>
              <p>③ AI 에이전트의 응답은 참고용이며, 법률, 의료, 재무 등 전문 분야의 조언을 대체하지 않습니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">제5조 (이용자의 의무)</h2>
              <p>이용자는 다음 행위를 하여서는 안 됩니다:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>타인의 개인정보를 무단 수집·이용하는 행위</li>
                <li>서비스를 이용하여 불법적인 목적의 콘텐츠를 생성하는 행위</li>
                <li>서비스의 정상적 운영을 방해하는 행위</li>
                <li>서비스를 통해 얻은 정보를 회사의 사전 동의 없이 상업적으로 이용하는 행위</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">제6조 (책임 제한)</h2>
              <p>① 회사는 AI 에이전트가 생성한 응답의 정확성, 완전성, 적시성을 보장하지 않습니다.</p>
              <p>② 이용자가 AI 응답을 기반으로 내린 판단이나 행동에 대한 책임은 이용자에게 있습니다.</p>
              <p>③ 회사는 무료 서비스 이용과 관련하여 관련 법령에 특별한 규정이 없는 한 책임을 지지 않습니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">제7조 (유료 서비스)</h2>
              <p>① 유료 서비스의 이용 요금 및 결제 방법은 서비스 내에 별도 안내합니다.</p>
              <p>② 결제 취소 및 환불은 관련 법령 및 회사 정책에 따릅니다.</p>
              <p>③ 구독 서비스는 해지 요청 시 다음 결제일부터 적용됩니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">제8조 (분쟁 해결)</h2>
              <p>이 약관에 관한 분쟁은 대한민국 법률에 따르며, 관할 법원은 회사 소재지 법원으로 합니다.</p>
            </section>

            <p className="text-gray-400 dark:text-gray-500 mt-8">시행일: 2026년 2월 3일</p>
          </div>
        </div>
      </main>
    </>
  );
}
