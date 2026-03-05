"use client";

import { cn } from "@/lib/utils";

const LAST_UPDATED = "2025년 3월 5일";

const sections = [
  {
    title: "1. 개인정보의 수집 항목 및 수집 방법",
    content: `BREEDY(이하 "서비스")는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.

■ 필수 수집 항목
  • 소셜 로그인 정보 (카카오, 구글, Apple): 이메일, 이름(닉네임), 프로필 이미지
  • 서비스 이용 기록, 접속 로그, 접속 IP 정보

■ 선택 수집 항목
  • 프로필 사진, 브리더명, 소개글
  • 반려동물 관련 정보 (이름, 종, 모프, 사진 등)

■ 수집 방법
  • 소셜 로그인을 통한 자동 수집
  • 서비스 이용 과정에서 이용자가 직접 입력`,
  },
  {
    title: "2. 개인정보의 수집 및 이용 목적",
    content: `수집한 개인정보는 다음의 목적을 위해 이용됩니다.

  • 회원 가입 및 관리: 본인 확인, 회원 식별, 서비스 부정 이용 방지
  • 서비스 제공: 반려동물 개체 관리, 가계도 분석, 분양 관리 등 핵심 기능 제공
  • 서비스 개선: 서비스 이용 통계 분석, 신규 기능 개발, 서비스 품질 향상
  • 고객 지원: 이용자 문의 대응, 공지사항 전달`,
  },
  {
    title: "3. 개인정보의 보유 및 이용 기간",
    content: `① 서비스는 이용자의 개인정보를 수집·이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.

② 단, 다음의 경우 명시한 기간 동안 보관합니다.
  • 서비스 이용 기록: 회원 탈퇴 시까지
  • 부정 이용 방지를 위한 기록: 탈퇴 후 1년
  • 관련 법령에 의한 보관
    - 계약 또는 청약 철회에 관한 기록: 5년 (전자상거래법)
    - 소비자 불만 또는 분쟁 처리에 관한 기록: 3년 (전자상거래법)
    - 접속에 관한 기록: 3개월 (통신비밀보호법)`,
  },
  {
    title: "4. 개인정보의 제3자 제공",
    content: `서비스는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.

  • 이용자가 사전에 동의한 경우
  • 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우`,
  },
  {
    title: "5. 개인정보의 파기 절차 및 방법",
    content: `① 파기 절차: 보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 별도의 DB로 옮겨져 내부 방침 및 관련 법령에 따라 일정 기간 저장된 후 파기됩니다.

② 파기 방법
  • 전자적 파일: 기술적 방법을 사용하여 복구할 수 없도록 영구 삭제
  • 출력물: 분쇄기로 분쇄하거나 소각`,
  },
  {
    title: "6. 이용자의 권리와 행사 방법",
    content: `이용자는 다음과 같은 권리를 행사할 수 있습니다.

  • 개인정보 열람 요구
  • 개인정보 정정·삭제 요구
  • 개인정보 처리 정지 요구
  • 회원 탈퇴 (설정 > 계정 관리 > 회원 탈퇴)

이용자의 권리 행사는 서비스 내 설정 또는 이메일(greenonion.dev@gmail.com)을 통해 가능하며, 서비스는 지체 없이 필요한 조치를 취합니다.`,
  },
  {
    title: "7. 개인정보의 안전성 확보 조치",
    content: `서비스는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.

  • 개인정보의 암호화: 비밀번호 등 중요 정보는 암호화하여 저장·관리
  • 접근 권한 관리: 개인정보에 대한 접근 권한을 최소한의 인원으로 제한
  • 보안 프로그램 설치 및 갱신: 해킹 등에 의한 개인정보 유출을 방지하기 위한 보안 조치`,
  },
  {
    title: "8. 개인정보 보호책임자",
    content: `서비스는 개인정보 처리에 관한 업무를 총괄하여 책임지고, 이용자의 불만 처리 및 피해 구제를 위해 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.

  • 이메일: greenonion.dev@gmail.com

기타 개인정보 침해에 대한 신고나 상담이 필요한 경우 아래 기관에 문의하실 수 있습니다.
  • 개인정보침해신고센터 (privacy.kisa.or.kr / 118)
  • 개인정보분쟁조정위원회 (kopico.go.kr / 1833-6972)`,
  },
  {
    title: "9. 개인정보처리방침의 변경",
    content: `본 개인정보처리방침은 법령, 정책 또는 서비스 변경에 따라 내용이 추가, 삭제 및 수정될 수 있습니다. 변경 시에는 시행일 최소 7일 전부터 서비스 내 공지사항을 통해 고지합니다.

본 개인정보처리방침은 ${LAST_UPDATED}부터 시행됩니다.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-gray-50 dark:bg-[#111]">
      <div className="flex flex-col gap-4 p-4">
        <section>
          <h2 className="mb-1 px-2 text-[13px] font-medium text-gray-500 uppercase dark:text-gray-400">
            개인정보처리방침
          </h2>
          <p className="mb-3 px-2 text-[12px] text-gray-400 dark:text-gray-500">
            최종 수정일: {LAST_UPDATED}
          </p>
          <div className="overflow-hidden rounded-xl border-2 border-neutral-100 bg-white dark:border-neutral-800 dark:bg-[#18171C]">
            {sections.map((section, idx) => (
              <div
                key={section.title}
                className={cn(
                  "px-4 py-4",
                  idx < sections.length - 1 &&
                    "border-b border-gray-100 dark:border-neutral-700",
                )}
              >
                <h3 className="mb-2 text-[14px] font-semibold text-gray-800 dark:text-gray-200">
                  {section.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-gray-600 whitespace-pre-line dark:text-gray-400">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
