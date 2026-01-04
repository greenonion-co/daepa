import { Button } from "@/components/ui/button";
import Loading from "@/components/common/Loading";
import { cn } from "@/lib/utils";

interface EditActionButtonsProps {
  isVisible: boolean;
  isEditMode: boolean;
  isProcessing: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  defaultLabel?: string;
  editModeLabel?: string;
}

const EditActionButtons = ({
  isVisible,
  isEditMode,
  isProcessing,
  onCancel,
  onSubmit,
  defaultLabel = "수정하기",
  editModeLabel = "수정된 사항 저장하기",
}: EditActionButtonsProps) => {
  if (!isVisible) return null;

  return (
    <div className="mt-2 flex w-full flex-1 items-end gap-2">
      {isEditMode && (
        <Button
          disabled={isProcessing}
          className="h-10 flex-1 cursor-pointer rounded-lg font-bold"
          onClick={onCancel}
        >
          취소
        </Button>
      )}
      <Button
        disabled={isProcessing}
        className={cn(
          "h-10 flex-[2] cursor-pointer rounded-lg font-bold",
          isEditMode && "bg-blue-700 hover:bg-blue-700/90 dark:bg-blue-800 dark:text-gray-100",
          isProcessing && "bg-gray-300",
        )}
        onClick={onSubmit}
      >
        {isProcessing ? <Loading /> : isEditMode ? editModeLabel : defaultLabel}
      </Button>
    </div>
  );
};

export default EditActionButtons;
