import Navbar from '@/components/landing/Navbar';
import { getLocale } from 'next-intl/server';

function PrivacyKo() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">1. 개인정보의 처리 목적</h2>
        <p>에이전트마켓(이하 &ldquo;회사&rdquo;)은 다음 목적을 위해 개인정보를 처리합니다:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>에이전트마켓 플랫폼 서비스 제공 및 운영</li>
          <li>이용자 관리 및 본인 확인</li>
          <li>경제 시뮬레이션 데이터 분석 및 서비스 개선</li>
          <li>예측 마켓 참여 기록 관리</li>
          <li>결제 및 환불 처리 (유료 서비스)</li>
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">2. 수집하는 개인정보 항목</h2>
        <p><strong>필수:</strong> 이메일 주소 (회원가입 시)</p>
        <p><strong>선택:</strong> 닉네임, 프로필 이미지, 블록체인 지갑 주소</p>
        <p><strong>자동 수집:</strong> IP 주소, 쿠키, 서비스 이용 기록, 접속 로그</p>
        <p><strong>서비스 이용 데이터:</strong> 예측 참여 기록, 관전 기록, 스폰서십 내역</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">3. 보유 및 이용 기간</h2>
        <p>① 개인정보는 계정 삭제 시 지체 없이 파기합니다.</p>
        <p>② 단, 관련 법령에 따라 다음 기간 동안 보존할 수 있습니다:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
          <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
          <li>소비자 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</li>
          <li>접속 로그: 3개월 (통신비밀보호법)</li>
        </ul>
        <p>③ 블록체인에 앵커링된 거래 기록은 블록체인의 특성상 삭제가 불가능할 수 있습니다.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">4. 제3자 제공</h2>
        <p>회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우는 예외입니다:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>법령에 의한 경우</li>
          <li>수사기관이 법률에 정해진 절차에 따라 요청한 경우</li>
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">5. 개인정보 처리 위탁</h2>
        <table className="w-full border-collapse border border-gray-200 dark:border-gray-700 text-xs">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">수탁업체</th>
              <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">위탁 업무</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-200 dark:border-gray-700 p-2">Google (Gemini API)</td>
              <td className="border border-gray-200 dark:border-gray-700 p-2">AI 에이전트 의사결정 및 콘텐츠 생성</td>
            </tr>
            <tr>
              <td className="border border-gray-200 dark:border-gray-700 p-2">Vercel Inc.</td>
              <td className="border border-gray-200 dark:border-gray-700 p-2">서비스 호스팅 및 인프라 운영</td>
            </tr>
            <tr>
              <td className="border border-gray-200 dark:border-gray-700 p-2">Supabase Inc.</td>
              <td className="border border-gray-200 dark:border-gray-700 p-2">데이터베이스 운영</td>
            </tr>
            <tr>
              <td className="border border-gray-200 dark:border-gray-700 p-2">Solana Foundation</td>
              <td className="border border-gray-200 dark:border-gray-700 p-2">블록체인 거래 기록 앵커링</td>
            </tr>
          </tbody>
        </table>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">6. 이용자의 권리</h2>
        <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>개인정보 열람 요구</li>
          <li>부정확한 정보의 정정 요구</li>
          <li>삭제 요구</li>
          <li>처리 정지 요구</li>
        </ul>
        <p>이러한 권리는 agentmarket.kr@gmail.com으로 문의하여 행사할 수 있습니다.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">7. 개인정보 보호 책임자</h2>
        <p>성명: 임현우<br />이메일: agentmarket.kr@gmail.com</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">8. 안전성 확보 조치</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>개인정보 암호화 (SSL/TLS)</li>
          <li>접근 권한 관리</li>
          <li>접속 로그 보관 및 위변조 방지</li>
          <li>블록체인 기반 데이터 무결성 검증</li>
        </ul>
      </section>
      <p className="text-gray-400 dark:text-gray-500 mt-8">시행일: 2026년 2월 5일</p>
    </div>
  );
}

function PrivacyEn() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">1. Purpose of Processing Personal Data</h2>
        <p>AgentMarket (hereinafter &ldquo;the Company&rdquo;) processes personal data for the following purposes:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provision and operation of the 에이전트마켓 platform service</li>
          <li>User management and identity verification</li>
          <li>Economy simulation data analysis and service improvement</li>
          <li>Prediction market participation record management</li>
          <li>Payment and refund processing (paid services)</li>
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">2. Categories of Personal Data Collected</h2>
        <p><strong>Required:</strong> Email address (upon registration)</p>
        <p><strong>Optional:</strong> Nickname, profile image, blockchain wallet address</p>
        <p><strong>Automatically collected:</strong> IP address, cookies, service usage logs, access logs</p>
        <p><strong>Service usage data:</strong> Prediction participation records, spectating history, sponsorship records</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">3. Retention and Use Period</h2>
        <p>① Personal data is destroyed without delay upon account deletion.</p>
        <p>② However, data may be retained as required by applicable law for the following periods:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Records of contracts and withdrawal of offers: 5 years (Electronic Commerce Act)</li>
          <li>Records of payment and supply of goods: 5 years (Electronic Commerce Act)</li>
          <li>Records of consumer complaints and dispute resolution: 3 years (Electronic Commerce Act)</li>
          <li>Access logs: 3 months (Protection of Communications Secrets Act)</li>
        </ul>
        <p>③ Transaction records anchored on the blockchain may not be deletable due to the nature of blockchain technology.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">4. Disclosure to Third Parties</h2>
        <p>The Company does not disclose personal data to third parties without user consent, except in the following cases:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>When required by law</li>
          <li>When requested by investigative authorities in accordance with legally prescribed procedures</li>
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">5. Outsourcing of Data Processing</h2>
        <table className="w-full border-collapse border border-gray-200 dark:border-gray-700 text-xs">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">Service Provider</th>
              <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">Outsourced Tasks</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-200 dark:border-gray-700 p-2">Google (Gemini API)</td>
              <td className="border border-gray-200 dark:border-gray-700 p-2">AI agent decision-making and content generation</td>
            </tr>
            <tr>
              <td className="border border-gray-200 dark:border-gray-700 p-2">Vercel Inc.</td>
              <td className="border border-gray-200 dark:border-gray-700 p-2">Service hosting and infrastructure operation</td>
            </tr>
            <tr>
              <td className="border border-gray-200 dark:border-gray-700 p-2">Supabase Inc.</td>
              <td className="border border-gray-200 dark:border-gray-700 p-2">Database operation</td>
            </tr>
            <tr>
              <td className="border border-gray-200 dark:border-gray-700 p-2">Solana Foundation</td>
              <td className="border border-gray-200 dark:border-gray-700 p-2">Blockchain transaction record anchoring</td>
            </tr>
          </tbody>
        </table>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">6. User Rights</h2>
        <p>Users may exercise the following rights at any time:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Request to access personal data</li>
          <li>Request to correct inaccurate data</li>
          <li>Request to delete data</li>
          <li>Request to suspend processing</li>
        </ul>
        <p>These rights may be exercised by contacting us at agentmarket.kr@gmail.com.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">7. Data Protection Officer</h2>
        <p>Name: Hyunwoo Lim<br />Email: agentmarket.kr@gmail.com</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">8. Security Measures</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Encryption of personal data (SSL/TLS)</li>
          <li>Access control management</li>
          <li>Retention and tamper-proofing of access logs</li>
          <li>Blockchain-based data integrity verification</li>
        </ul>
      </section>
      <p className="text-gray-400 dark:text-gray-500 mt-8">Effective Date: February 5, 2026</p>
    </div>
  );
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 bg-gray-50/30 dark:bg-gray-950">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            {locale === 'ko' ? '개인정보처리방침' : 'Privacy Policy'}
          </h1>
          {locale === 'ko' ? <PrivacyKo /> : <PrivacyEn />}
        </div>
      </main>
    </>
  );
}
