"use client";

import { useState } from "react";
import { ArrowLeft, ChevronDown, Mail } from "lucide-react";
import { useAppRouter } from "@/hooks/useAppRouter";
import { cn } from "@/lib/utils";

type FaqItem = { q: string; a: string };
type FaqCategory = { title: string; items: FaqItem[] };

const FAQ_DATA: FaqCategory[] = [
  {
    title: "서비스 소개",
    items: [
      {
        q: "BREEDY는 어떤 서비스인가요?",
        a: "BREEDY는 반려동물 브리더를 위한 개체 관리 플랫폼입니다. 개체 등록, 가계도 관리, 해칭(브리딩) 기록, 분양 관리 등의 기능을 제공합니다.",
      },
      {
        q: "어떤 종의 동물을 관리할 수 있나요?",
        a: "현재 크레스티드 게코를 중심으로 지원하고 있으며, 지원 종은 계속 확대될 예정입니다.",
      },
      {
        q: "서비스 이용 요금이 있나요?",
        a: "기본 기능은 무료로 이용할 수 있습니다. 추후 프리미엄 기능이 추가될 수 있습니다.",
      },
    ],
  },
  {
    title: "개체 관리",
    items: [
      {
        q: "개체는 어떻게 등록하나요?",
        a: "홈 화면에서 '+' 버튼을 누르면 개체 등록 화면으로 이동합니다. 이름, 종, 모프, 성별, 해칭일 등의 정보를 입력하여 등록할 수 있습니다.",
      },
      {
        q: "가계도는 어떻게 확인하나요?",
        a: "개체 상세 페이지에서 '가계도' 버튼을 누르면 해당 개체의 혈통 관계를 시각적으로 확인할 수 있습니다. 부모-자식 관계와 COI(근교계수)도 함께 표시됩니다.",
      },
      {
        q: "QR 코드는 어떻게 사용하나요?",
        a: "개체 상세 페이지에서 QR 버튼을 누르면 해당 개체의 QR 코드를 생성할 수 있습니다. QR 코드를 인쇄하여 사육장에 부착하면 빠르게 개체 정보를 확인할 수 있습니다.",
      },
    ],
  },
  {
    title: "해칭 / 분양",
    items: [
      {
        q: "메이팅 기록은 어떻게 등록하나요?",
        a: "해칭 탭에서 '메이팅 추가' 버튼을 눌러 부모 개체를 선택하고 메이팅 정보를 등록할 수 있습니다. 산란, 해칭 기록도 순차적으로 관리할 수 있습니다.",
      },
      {
        q: "분양 관리는 어떻게 하나요?",
        a: "분양 탭에서 분양할 개체를 선택하고 분양 정보(분양가, 분양처 등)를 등록할 수 있습니다. 분양 현황을 대시보드에서 한눈에 확인할 수 있습니다.",
      },
    ],
  },
  {
    title: "계정",
    items: [
      {
        q: "로그인은 어떻게 하나요?",
        a: "카카오, 구글, Apple 계정으로 간편하게 로그인할 수 있습니다. 별도의 회원가입 절차 없이 소셜 로그인으로 바로 이용 가능합니다.",
      },
      {
        q: "계정을 삭제하고 싶어요.",
        a: "설정 > 계정 관리 > 회원 탈퇴에서 계정을 삭제할 수 있습니다. 탈퇴 시 등록된 모든 데이터가 삭제되며 복구가 불가능합니다.",
      },
    ],
  },
];

const SUPPORT_EMAIL = "greenonion.dev@gmail.com";

function FaqAccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-b-0 dark:border-neutral-700">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 dark:active:bg-neutral-800"
      >
        <span className="flex-1 text-[15px] text-gray-900 dark:text-white">{item.q}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 text-[14px] leading-relaxed text-gray-600 dark:text-gray-400">
          {item.a}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-gray-50 dark:bg-[#111]">
      <div className="flex flex-col gap-4 p-4">
        {/* FAQ 섹션 */}
        <section>
          <h2 className="mb-3 px-2 text-[13px] font-medium text-gray-500 uppercase dark:text-gray-400">
            자주 묻는 질문
          </h2>
          <div className="flex flex-col gap-3">
            {FAQ_DATA.map((category) => (
              <div
                key={category.title}
                className="overflow-hidden rounded-xl border-2 border-neutral-100 bg-white dark:border-neutral-800 dark:bg-[#18171C]"
              >
                <div className="border-b border-gray-100 px-4 py-2.5 dark:border-neutral-700">
                  <h3 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">
                    {category.title}
                  </h3>
                </div>
                {category.items.map((item) => (
                  <FaqAccordionItem key={item.q} item={item} />
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* 고객센터 섹션 */}
        <section id="contact">
          <h2 className="mb-3 px-2 text-[13px] font-medium text-gray-500 uppercase dark:text-gray-400">
            고객센터
          </h2>
          <div className="overflow-hidden rounded-xl border-2 border-neutral-100 bg-white dark:border-neutral-800 dark:bg-[#18171C]">
            <div className="p-4">
              <p className="mb-3 text-[14px] text-gray-600 dark:text-gray-400">
                궁금한 점이나 문제가 있으시면 이메일로 문의해주세요.
                <br />
                영업일 기준 1~2일 내에 답변드립니다.
              </p>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-gray-200"
              >
                <Mail className="h-4 w-4" />
                {SUPPORT_EMAIL}
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
