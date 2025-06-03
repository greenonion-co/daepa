import { PetParentDtoWithMessage } from "@/app/(브리더스룸)/pet/store/parentLink";
import { Badge } from "@/components/ui/badge";
import { Send } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface LinkStepProps {
  selectedPet: PetParentDtoWithMessage;
  currentUserId: string;
  onSelect: (pet: PetParentDtoWithMessage) => void;
  onClose: () => void;
}

const LinkStep = ({ selectedPet, currentUserId, onSelect, onClose }: LinkStepProps) => {
  const [message, setMessage] = useState<string | null>(null);

  const defaultMessage = (pet: PetParentDtoWithMessage) => {
    return `안녕하세요, ${pet.name}님.\n${pet.name}를 ${
      pet.sex?.toString() === "M" ? "부" : "모"
    } 개체로 등록하고 싶습니다.`;
  };

  return (
    <div className="px-4">
      {selectedPet && (
        <div className="space-y-6">
          {/* 상단 정보 영역 */}
          <div className="flex gap-6">
            <div className="relative aspect-square w-72 overflow-hidden rounded-xl">
              <Image
                src="/default-pet-image.png"
                alt={selectedPet.name ?? ""}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1">
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-2xl font-bold">{selectedPet.name}</h3>
                  <Badge variant="outline" className="bg-blue-50 text-black">
                    {selectedPet.sex?.toString() === "M" ? "수컷" : "암컷"}
                  </Badge>
                </div>
                <p className="text-gray-600">소유자: {selectedPet.owner?.name}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="mb-1.5 text-sm font-medium text-gray-500">모프</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedPet.morphs?.map((morph) => (
                      <Badge key={morph} className="bg-blue-800 text-white">
                        {morph}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-1.5 text-sm font-medium text-gray-500">특성</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedPet.traits?.map((trait) => (
                      <Badge
                        variant="outline"
                        key={trait}
                        className="bg-white text-black dark:bg-blue-100"
                      >
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 요청 메시지 영역 */}
          {selectedPet.owner.userId !== currentUserId ? (
            <div className="space-y-2 rounded-xl">
              <div>
                <div className="flex items-center gap-1">
                  <h4 className="font-medium">부모 개체 연결 요청</h4>
                  <Send className="h-3 w-3" />
                </div>
                <p className="text-xs text-gray-500">
                  {selectedPet.owner?.name}님에게 부모 개체 연결을 요청합니다.
                </p>
              </div>

              <div className="space-y-2">
                <textarea
                  className="w-full rounded-lg bg-gray-100 p-3 text-sm focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:placeholder:text-gray-500"
                  rows={3}
                  value={message ?? defaultMessage(selectedPet)}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  * 요청이 수락되면 해당 개체가 부모로 등록됩니다.
                </p>
              </div>

              <div className="flex gap-2 bg-white dark:bg-[#18181B]">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-gray-200 py-3 font-medium hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={() =>
                    onSelect({
                      ...selectedPet,
                      message: message ?? defaultMessage(selectedPet),
                    })
                  }
                  className="flex-1 rounded-xl bg-blue-500 py-3 font-medium text-white hover:bg-blue-600"
                >
                  연결 요청하기
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => onSelect(selectedPet)}
              className="flex w-full items-center justify-center rounded-xl bg-blue-500 py-3 font-medium text-white hover:bg-blue-600"
            >
              연결
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LinkStep;
