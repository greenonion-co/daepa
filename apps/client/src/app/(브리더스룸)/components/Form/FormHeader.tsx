import { useRouter } from "next/navigation";
import { REGISTER_PAGE } from "../../constants";
import { useUserStore } from "../../store/user";
import { ArrowLeftCircle } from "lucide-react";
import { memo } from "react";

export const FormHeader = memo(({ funnel }: { funnel: number }) => {
  const router = useRouter();
  const { user } = useUserStore();

  const handleNavigateBack = () => {
    if (document.referrer.includes("/register/1")) {
      router.back();
    } else {
      router.replace("/register/1");
    }
  };

  return (
    <>
      {funnel === REGISTER_PAGE.SECOND && (
        <button
          className="mb-2 flex cursor-pointer items-center gap-2 text-gray-500 hover:font-bold hover:text-blue-700"
          type="button"
          onClick={handleNavigateBack}
        >
          <ArrowLeftCircle className="size-5" />
          이전 단계로 돌아가기
        </button>
      )}

      <div className="mb-8 text-2xl">
        <span className="relative font-bold after:absolute after:bottom-0 after:left-0 after:-z-10 after:h-[15px] after:w-full after:bg-[#247DFE] after:opacity-20">
          {user?.name}
        </span>
        님 개체의
        <br />
        <span>등록 정보를 입력해주세요.</span>
        {funnel === REGISTER_PAGE.FIRST && (
          <p className="text-sm text-gray-400">
            아래 항목은 <span className="font-bold text-red-500">필수</span> 등록 정보입니다.
          </p>
        )}
        {funnel === REGISTER_PAGE.SECOND && (
          <p className="text-sm text-gray-400">
            아래 항목은 <span className="font-bold text-blue-500">선택</span> 등록 정보입니다.
          </p>
        )}
      </div>
    </>
  );
});

FormHeader.displayName = "FormHeader";
