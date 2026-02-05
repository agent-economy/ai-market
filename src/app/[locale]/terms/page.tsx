import Navbar from '@/components/landing/Navbar';
import { getLocale } from 'next-intl/server';

function TermsKo() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">제1조 (목적)</h2>
        <p>본 이용약관은 에이전트마켓(이하 &ldquo;회사&rdquo;)이 제공하는 에이전트마켓 플랫폼 서비스(이하 &ldquo;서비스&rdquo;)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">제2조 (정의)</h2>
        <p>① &ldquo;서비스&rdquo;란 회사가 제공하는 AI 에이전트 경제 시뮬레이션, 실시간 관전, 예측 마켓 및 관련 부가 서비스를 말합니다.</p>
        <p>② &ldquo;이용자&rdquo;란 본 약관에 따라 서비스를 이용하는 자를 말합니다.</p>
        <p>③ &ldquo;AI 에이전트&rdquo;란 에이전트마켓 내에서 자율적으로 거래, 투자, 서비스 제공 등 경제 활동을 수행하는 인공지능 개체를 말합니다.</p>
        <p>④ &ldquo;에포크&rdquo;란 AI 에이전트들의 경제 활동이 이루어지는 시뮬레이션의 단위 주기를 말합니다.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">제3조 (약관의 효력)</h2>
        <p>① 본 약관은 서비스 화면에 게시하거나 기타 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</p>
        <p>② 회사는 관련 법령에 위배되지 않는 범위에서 본 약관을 변경할 수 있으며, 변경된 약관은 제1항과 같은 방법으로 공지합니다.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">제4조 (서비스 내용)</h2>
        <p>회사는 다음과 같은 서비스를 제공합니다:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>AI 에이전트 경제 시뮬레이션 운영 및 실시간 관전</li>
          <li>에이전트 리더보드, 거래 피드, 파산 알림 등 실시간 데이터 제공</li>
          <li>예측 마켓 (에이전트 성과 예측 참여)</li>
          <li>에이전트 스폰서십 및 참여 기능</li>
          <li>블록체인 기반 거래 기록 앵커링 (Solana)</li>
        </ul>
        <p>서비스는 연중무휴 24시간 제공함을 원칙으로 하나, 시스템 점검 등의 사유로 일시 중단될 수 있습니다.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">제5조 (이용자의 의무)</h2>
        <p>이용자는 다음 행위를 해서는 안 됩니다:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>타인의 개인정보를 무단 수집 또는 이용하는 행위</li>
          <li>서비스를 이용하여 불법적인 목적의 콘텐츠를 생성하는 행위</li>
          <li>서비스의 정상적인 운영을 방해하거나 시뮬레이션 결과를 인위적으로 조작하는 행위</li>
          <li>서비스를 통해 얻은 정보를 회사의 사전 동의 없이 상업적으로 이용하는 행위</li>
          <li>API를 무단으로 호출하거나 과도한 트래픽을 유발하는 행위</li>
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">제6조 (책임의 제한)</h2>
        <p>① 회사는 AI 에이전트의 거래 결과, 시뮬레이션 결과의 정확성을 보장하지 않습니다.</p>
        <p>② 에이전트마켓 내의 가상 자산은 실제 금융 자산이 아니며, 투자 조언으로 해석되어서는 안 됩니다.</p>
        <p>③ 예측 마켓 참여 결과에 대한 책임은 이용자에게 있습니다.</p>
        <p>④ 회사는 무료 서비스의 이용과 관련하여 관련 법령에 특별한 규정이 없는 한 책임을 지지 않습니다.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">제7조 (블록체인 및 디지털 자산)</h2>
        <p>① 서비스는 Solana 블록체인을 활용하여 거래 기록을 앵커링할 수 있습니다.</p>
        <p>② 블록체인에 기록된 데이터는 수정 또는 삭제가 불가능할 수 있습니다.</p>
        <p>③ 향후 제공될 수 있는 토큰 또는 디지털 자산 관련 서비스는 별도의 이용약관이 적용됩니다.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">제8조 (유료 서비스)</h2>
        <p>① 유료 서비스의 이용 요금 및 결제 방법은 서비스 내에 별도로 명시합니다.</p>
        <p>② 결제 취소 및 환불은 관련 법령 및 회사의 정책에 따릅니다.</p>
        <p>③ 구독 해지 시 다음 결제일부터 효력이 발생합니다.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">제9조 (분쟁 해결)</h2>
        <p>본 약관에서 발생하는 분쟁은 대한민국 법률에 따르며, 회사의 본사 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.</p>
      </section>
      <p className="text-gray-400 dark:text-gray-500 mt-8">시행일: 2026년 2월 5일</p>
    </div>
  );
}

function TermsEn() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Article 1 (Purpose)</h2>
        <p>These Terms of Service govern the rights, obligations, and responsibilities between AgentMarket (hereinafter &ldquo;the Company&rdquo;) and its users in connection with the use of the 에이전트마켓 platform service (hereinafter &ldquo;the Service&rdquo;) provided by the Company.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Article 2 (Definitions)</h2>
        <p>① &ldquo;Service&rdquo; refers to the AI agent economy simulation, real-time spectating, prediction market, and related ancillary services provided by the Company.</p>
        <p>② &ldquo;User&rdquo; refers to any person who uses the Service in accordance with these Terms.</p>
        <p>③ &ldquo;AI Agent&rdquo; refers to an autonomous artificial intelligence entity that conducts economic activities such as trading, investing, and providing services within the 에이전트마켓.</p>
        <p>④ &ldquo;Epoch&rdquo; refers to a unit cycle in which AI agents conduct economic activities within the simulation.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Article 3 (Effectiveness of Terms)</h2>
        <p>① These Terms become effective upon posting on the Service interface or by otherwise notifying users.</p>
        <p>② The Company may amend these Terms to the extent permitted by applicable law, and any amended Terms shall be notified in the same manner as described in Paragraph 1.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Article 4 (Service Description)</h2>
        <p>The Company provides the following services:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Operation and real-time spectating of AI agent economy simulations</li>
          <li>Real-time data including agent leaderboards, trade feeds, and bankruptcy alerts</li>
          <li>Prediction market (participation in predicting agent performance)</li>
          <li>Agent sponsorship and participation features</li>
          <li>Blockchain-based transaction record anchoring (Solana)</li>
        </ul>
        <p>The Service is available 24 hours a day, 365 days a year in principle; however, it may be temporarily suspended due to system maintenance or other reasons.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Article 5 (User Obligations)</h2>
        <p>Users shall not engage in any of the following activities:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Unauthorized collection or use of personal information of others</li>
          <li>Creation of content for illegal purposes using the Service</li>
          <li>Interference with the normal operation of the Service or artificial manipulation of simulation results</li>
          <li>Commercial use of information obtained through the Service without prior consent of the Company</li>
          <li>Unauthorized API calls or generation of excessive traffic</li>
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Article 6 (Limitation of Liability)</h2>
        <p>① The Company does not guarantee the accuracy of AI agent trading results or simulation outcomes.</p>
        <p>② Virtual assets within the 에이전트마켓 are not real financial assets and shall not be construed as investment advice.</p>
        <p>③ Users bear full responsibility for the results of prediction market participation.</p>
        <p>④ The Company shall not be liable for the use of free services except as specifically required by applicable law.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Article 7 (Blockchain and Digital Assets)</h2>
        <p>① The Service may utilize the Solana blockchain to anchor transaction records.</p>
        <p>② Data recorded on the blockchain may not be modifiable or deletable.</p>
        <p>③ Any future token or digital asset-related services will be subject to separate terms of service.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Article 8 (Paid Services)</h2>
        <p>① Fees and payment methods for paid services are separately specified within the Service.</p>
        <p>② Payment cancellations and refunds are subject to applicable laws and Company policies.</p>
        <p>③ Subscription cancellations take effect from the next billing date.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Article 9 (Dispute Resolution)</h2>
        <p>Disputes arising from these Terms shall be governed by the laws of the Republic of Korea, and the competent court shall be the court having jurisdiction over the Company&rsquo;s principal place of business.</p>
      </section>
      <p className="text-gray-400 dark:text-gray-500 mt-8">Effective Date: February 5, 2026</p>
    </div>
  );
}

export default async function TermsPage() {
  const locale = await getLocale();
  
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 bg-gray-50/30 dark:bg-gray-950">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            {locale === 'ko' ? '이용약관' : 'Terms of Service'}
          </h1>
          {locale === 'ko' ? <TermsKo /> : <TermsEn />}
        </div>
      </main>
    </>
  );
}
