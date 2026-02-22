import { Lock } from "lucide-react";
import { forwardRef } from "react";

/** 테이블에서 부모 펫이 비공개 상태일 때 표시되는 뱃지 */
const HiddenPetBadge = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  (props, ref) => {
    return (
      <div ref={ref} className={"inline-flex items-center gap-0.5"} {...props}>
        <Lock className="h-3 w-3 text-gray-500 dark:text-gray-400" />
        <span className={"text-gray-600 dark:text-gray-400"}>비공개</span>
      </div>
    );
  },
);

HiddenPetBadge.displayName = "HiddenPetBadge";

export default HiddenPetBadge;
