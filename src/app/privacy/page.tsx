import Navbar from '@/components/landing/Navbar';

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 bg-gray-50/30 dark:bg-gray-950">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">개인정보처리방침</h1>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">1. 개인정보의 처리 목적</h2>
              <p>에이전트마켓(이하 &ldquo;회사&rdquo;)은 다음의 목적을 위하여 개인정보를 처리합니다:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>서비스 제공 및 운영</li>
                <li>회원 관리 및 본인 확인</li>
                <li>서비스 이용 통계 분석 및 개선</li>
                <li>결제 및 환불 처리 (유료 서비스)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">2. 처리하는 개인정보 항목</h2>
              <p><strong>필수 항목:</strong> 이메일 주소 (회원가입 시)</p>
              <p><strong>선택 항목:</strong> 닉네임, 프로필 이미지</p>
              <p><strong>자동 수집:</strong> IP 주소, 쿠키, 서비스 이용 기록, 접속 로그</p>
              <p><strong>AI 대화 데이터:</strong> 이용자가 AI 에이전트와 주고받은 대화 내용 (서비스 품질 개선 목적)</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">3. 개인정보의 보유 및 이용 기간</h2>
              <p>① 회원 탈퇴 시 지체 없이 파기합니다.</p>
              <p>② 단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>계약·청약철회 기록: 5년 (전자상거래법)</li>
                <li>대금결제·재화 공급 기록: 5년 (전자상거래법)</li>
                <li>소비자 불만·분쟁처리 기록: 3년 (전자상거래법)</li>
                <li>접속 기록: 3개월 (통신비밀보호법)</li>
              </ul>
              <p>③ AI 대화 데이터는 최대 1년간 보관 후 비식별화 처리합니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">4. 개인정보의 제3자 제공</h2>
              <p>회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 단, 다음의 경우는 예외로 합니다:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>법령에 의해 요구되는 경우</li>
                <li>수사 목적으로 법령에 정해진 절차에 따라 요청이 있는 경우</li>
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
                    <td className="border border-gray-200 dark:border-gray-700 p-2">AI 응답 생성</td>
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
                    <td className="border border-gray-200 dark:border-gray-700 p-2">토스페이먼츠</td>
                    <td className="border border-gray-200 dark:border-gray-700 p-2">결제 처리</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">6. 이용자의 권리</h2>
              <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>개인정보 열람 요구</li>
                <li>오류가 있을 경우 정정 요구</li>
                <li>삭제 요구</li>
                <li>처리 정지 요구</li>
              </ul>
              <p>권리 행사는 이메일(support@agentmarket.kr)을 통해 하실 수 있습니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">7. 개인정보 보호책임자</h2>
              <p>성명: 임현우<br />이메일: support@agentmarket.kr</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">8. 개인정보 안전성 확보 조치</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>개인정보 암호화 (SSL/TLS)</li>
                <li>접근 권한 관리</li>
                <li>접속 기록 보관 및 위변조 방지</li>
              </ul>
            </section>

            <p className="text-gray-400 dark:text-gray-500 mt-8">시행일: 2026년 2월 3일</p>
          </div>
        </div>
      </main>
    </>
  );
}
