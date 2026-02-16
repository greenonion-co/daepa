import { CircleSmall } from "lucide-react";
import { forwardRef } from "react";

/** 테이블에서 부모 펫이 비공개 상태일 때 표시되는 뱃지 */
const HiddenPetBadge = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  (props, ref) => {
    return (
      <div ref={ref} className={"flex items-center gap-0.5"} {...props}>
        <CircleSmall className={`h-3 w-3 fill-gray-300 stroke-gray-300`} />
        <span className={"text-gray-500"}>비공개</span>
      </div>
    );
  },
);

HiddenPetBadge.displayName = "HiddenPetBadge";

export default HiddenPetBadge;
