import BottomSheet from "@/components/common/BottomSheet";
import { pairControllerUpdatePair, UpdatePairDto } from "@repo/api-client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { updatePairProps } from "./PairList";

const UpdatePairModal = ({
  pair,
  isOpen,
  close,
  onSuccess,
}: {
  pair: updatePairProps;
  isOpen: boolean;
  close: () => void;
  onSuccess: () => Promise<void>;
}) => {
  const [desc, setDesc] = useState<string>(pair.desc ?? "");
  const maxLength = 500;
  const currentLength = desc.length;
  const hasChanges = desc !== (pair.desc ?? "");

  const { mutateAsync: updatePair } = useMutation({
    mutationFn: (data: UpdatePairDto) => pairControllerUpdatePair(pair.pairId, data),
  });

  const handleUpdatePair = async (data: UpdatePairDto) => {
    try {
      await updatePair(data);

      await onSuccess();
      toast.success("메이팅 정보가 수정되었습니다.");
      close();
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message ?? "메이팅 수정에 실패했습니다.");
      } else {
        toast.error("메이팅 수정에 실패했습니다.");
      }
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={close}
      buttonText="저장"
      secondButtonText="취소"
      onClick={() => handleUpdatePair({ desc })}
      onSecondButtonClick={close}
      buttonDisabled={!hasChanges}
    >
      <div className="px-1 text-[16px] font-[500]">메모 수정</div>

      <div>
        <div className="relative pt-2">
          <textarea
            placeholder="메모를 추가해 보세요"
            className={`min-h-30 w-full rounded-xl bg-gray-100 p-2 pb-10 text-left text-[14px] focus:outline-none focus:ring-0 dark:bg-gray-600/50 dark:text-white`}
            value={desc}
            maxLength={maxLength}
            onChange={(e) => setDesc(e.target.value)}
            onClick={(e) => {
              e.stopPropagation();
            }}
            style={{ height: "auto" }}
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-500">
            {currentLength}/{maxLength}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};

export default UpdatePairModal;
