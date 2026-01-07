import { Pencil, MoreVertical, Edit, Trash2 } from "lucide-react";
import { TUTORIAL_TARGETS } from "./MatingDetailDialogTutorial";

const TutorialMockLayingItem = () => {
  return (
    <div className="mb-7">
      <div
        data-tutorial={TUTORIAL_TARGETS.LAYING_DATE}
        className="dark:bg-background sticky top-0 mb-1 flex items-center bg-white text-[15px] font-semibold text-gray-700 dark:text-gray-300"
      >
        <span className="mr-1 font-bold text-black">1차</span>
        <span className="text-sm text-gray-600 dark:text-gray-400">1월 15일</span>
        <Pencil className="ml-1 h-3 w-3 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-gray-700">
        {/* 튜토리얼용 가짜 알 아이템 */}
        <div className="flex w-full items-center justify-between p-1 pl-0 text-[14px]">
          <div className="flex">
            <div className="flex w-[56px] items-center justify-center font-semibold text-gray-500 dark:text-gray-400" />
            <div className="flex flex-col px-1 py-1.5">
              <div className="flex items-center gap-1 font-semibold">
                <div className="text-gray-800 dark:text-gray-200">1차-1</div>
                <span className="text-[12px] font-[500] text-gray-600 dark:text-gray-400">
                  | 28℃
                </span>
              </div>
              <div className="text-xs font-[500] text-blue-600 dark:text-blue-400">
                <span className="font-[400]">예상 해칭일: </span>
                2월 14일(금)
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="rounded-lg bg-yellow-700/80 px-2 py-0.5 text-[12px] font-[600] text-yellow-100">
              유정란
            </div>
            <div data-tutorial={TUTORIAL_TARGETS.EGG_MENU} className="relative">
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800"
              >
                <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
              {/* 튜토리얼용 열린 드롭다운 메뉴 */}
              <div className="absolute right-0 top-7 z-40 min-w-[120px] rounded-md border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Edit className="h-4 w-4 text-blue-600" />
                  <span>해칭 완료</span>
                </div>
                <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />
                <div className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Edit className="h-4 w-4 text-blue-600" />
                  <span>수정</span>
                </div>
                <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />
                <div className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Trash2 className="h-4 w-4 text-red-600" />
                  <span>삭제</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialMockLayingItem;
