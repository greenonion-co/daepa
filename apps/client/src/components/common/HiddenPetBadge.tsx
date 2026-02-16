import { Lock } from "lucide-react";

/** 부모 펫이 비공개 상태일 때 표시되는 뱃지. 자물쇠 아이콘 & '비공개' 텍스트 */
const HiddenPetBadge = () => {
  return (
    <div
      className={
        "flex w-fit items-center gap-1 rounded-md border border-yellow-200 bg-yellow-50 px-2 py-0.5 opacity-70"
      }
    >
      <Lock className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
      <span className={"text-yellow-600 dark:text-yellow-600"}>비공개</span>
    </div>
  );
};

export default HiddenPetBadge;
