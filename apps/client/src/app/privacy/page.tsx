import { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 - Breedy",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold">개인정보처리방침</h1>

      <p className="mb-6 text-sm text-gray-500">시행일: 2025년 3월 16일</p>

      <div className="space-y-8 text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            1. 개인정보의 수집 및 이용 목적
          </h2>
          <p>
            주식회사 그린어니언(이하 &quot;회사&quot;)은 Breedy 서비스(이하 &quot;서비스&quot;) 제공을 위해 다음과 같은
            목적으로 개인정보를 수집 및 이용합니다.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>회원 가입 및 관리: 본인 확인, 서비스 이용 자격 관리</li>
            <li>서비스 제공: 개체 관리, 가계도 분석, 분양 기능 등 핵심 서비스 운영</li>
            <li>고객 지원: 문의 대응 및 공지사항 전달</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            2. 수집하는 개인정보 항목
          </h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 pr-4 text-left font-semibold">구분</th>
                <th className="py-2 text-left font-semibold">항목</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              <tr>
                <td className="py-2 pr-4">필수</td>
                <td className="py-2">이름, 이메일 주소</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">서비스 이용</td>
                <td className="py-2">개체 사진, 개체 정보(모프, 해칭일 등), 분양 게시 내용</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">자동 수집</td>
                <td className="py-2">서비스 이용 기록, 접속 로그, 기기 정보</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            3. 개인정보의 보유 및 이용 기간
          </h2>
          <p>
            회원 탈퇴 시 지체 없이 파기합니다. 단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>전자상거래 등에서의 소비자 보호에 관한 법률: 계약 또는 청약 철회 기록 5년</li>
            <li>통신비밀보호법: 접속 로그 기록 3개월</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            4. 개인정보의 제3자 제공
          </h2>
          <p>
            회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령에 의해 요구되는 경우</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            5. 개인정보의 파기 절차 및 방법
          </h2>
          <p>
            보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다. 전자적 파일은 복구할 수 없는
            방법으로 삭제하며, 종이 문서는 분쇄하거나 소각합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            6. 이용자의 권리 및 행사 방법
          </h2>
          <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>개인정보 열람, 정정, 삭제 요청</li>
            <li>개인정보 처리 정지 요청</li>
            <li>회원 탈퇴</li>
          </ul>
          <p className="mt-2">
            위 권리 행사는 서비스 내 설정 또는 이메일(support@greenonion.co)을 통해 가능합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            7. 개인정보의 안전성 확보 조치
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>개인정보의 암호화 저장 및 전송</li>
            <li>접근 권한 관리 및 제한</li>
            <li>보안 프로그램 설치 및 주기적 점검</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            8. 개인정보 보호 책임자
          </h2>
          <ul className="list-none space-y-1">
            <li>회사명: 주식회사 그린어니언</li>
            <li>이메일: support@greenonion.co</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            9. 개인정보처리방침의 변경
          </h2>
          <p>
            본 방침은 시행일로부터 적용되며, 변경 시 서비스 내 공지를 통해 안내합니다.
          </p>
        </section>
      </div>
    </main>
  );
}