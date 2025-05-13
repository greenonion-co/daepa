"use client";

import { useState, useEffect, useRef } from "react";
import BottomSheet from "@/components/common/BottomSheet";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { PetSummaryDto } from "@/types/pet";
import { ChevronRight, Send } from "lucide-react";

interface ParentSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: PetSummaryDto) => void;
}

export default function ParentSearchSelector({ isOpen, onClose, onSelect }: ParentSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [step, setStep] = useState(1);
  const [selectedPet, setSelectedPet] = useState<PetSummaryDto | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // step이 변경될 때마다 스크롤 최상단으로 이동
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [step]);

  // TODO: 실제 검색 API 연동
  const searchResults = PET_LIST.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handlePetSelect = (pet: PetSummaryDto) => {
    setSelectedPet(pet);
    setStep(2);
  };

  const renderHeader = () => (
    <div className="sticky top-[-12px] z-20 bg-white pb-4 pt-4 dark:bg-[#18181B]">
      <div className="flex items-center gap-2 pl-2">
        <button
          onClick={() => step === 2 && setStep(1)}
          className={`text-lg font-bold ${step === 2 ? "text-gray-400 hover:text-gray-700" : ""}`}
        >
          부모 개체 검색
        </button>
        {step === 2 && (
          <>
            <ChevronRight className="h-5 w-5 text-gray-500" />
            <span className="text-lg font-bold">{selectedPet?.name}</span>
          </>
        )}
      </div>

      {step === 1 && (
        <div className="px-2 py-4">
          <input
            type="text"
            placeholder="부모 개체를 검색하세요"
            className="w-full rounded-xl border border-gray-200 p-3 focus:border-blue-500 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}
    </div>
  );

  const renderStep1 = () => (
    <div className="h-full overflow-y-auto px-2">
      <div className="mb-10 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
        {searchResults.map((item) => (
          <button
            key={item.petId}
            type="button"
            className="group flex cursor-pointer flex-col rounded-xl p-2 text-left"
            onClick={() => handlePetSelect(item)}
          >
            <div className="flex w-full flex-col items-center gap-1">
              <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                <Image
                  src={"/default-pet-image.png"}
                  alt={item.name}
                  fill
                  className="object-cover transition-opacity"
                />
              </div>
              <div className="flex w-full flex-col items-center gap-1">
                <div className="relative">
                  <span className="relative font-semibold after:absolute after:bottom-[-1px] after:left-1 after:h-[12px] after:w-full after:bg-transparent after:opacity-40 after:content-[''] group-hover:after:bg-[#247DFE]">
                    {item.name}
                  </span>
                </div>
                <div className="flex flex-wrap justify-center gap-1">
                  {item.morphs.map((morph) => (
                    <Badge key={morph} className="bg-blue-800 text-black text-white">
                      {morph}
                    </Badge>
                  ))}

                  {item.traits.map((trait) => (
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
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="px-4">
      {selectedPet && (
        <div className="space-y-6">
          {/* 상단 정보 영역 */}
          <div className="flex gap-6">
            <div className="relative aspect-square w-72 overflow-hidden rounded-xl">
              <Image
                src="/default-pet-image.png"
                alt={selectedPet.name}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1">
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-2xl font-bold">{selectedPet.name}</h3>
                  <Badge variant="outline" className="bg-blue-50 text-black">
                    {selectedPet.sex === "M" ? "수컷" : "암컷"}
                  </Badge>
                </div>
                <p className="text-gray-600">소유자: {selectedPet.owner}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="mb-1.5 text-sm font-medium text-gray-500">모프</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedPet.morphs.map((morph) => (
                      <Badge key={morph} className="bg-blue-800 text-white">
                        {morph}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-1.5 text-sm font-medium text-gray-500">특성</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedPet.traits.map((trait) => (
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
          <div className="space-y-2 rounded-xl">
            <div>
              <div className="flex items-center gap-1">
                <h4 className="font-medium">부모 개체 연결 요청</h4>
                <Send className="h-3 w-3" />
              </div>
              <p className="text-xs text-gray-500">
                {selectedPet.owner}님에게 부모 개체 연결을 요청합니다.
              </p>
            </div>

            <div className="space-y-2">
              <textarea
                className="w-full rounded-lg bg-gray-100 p-3 text-sm focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:placeholder:text-gray-500"
                rows={3}
                placeholder={`안녕하세요, ${selectedPet.owner}님.\n${selectedPet.name}를 부모 개체로 등록하고 싶습니다.`}
              />
              <p className="text-xs text-gray-500">
                * 요청이 수락되면 해당 개체가 부모로 등록됩니다.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-200 py-3 font-medium hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => onSelect(selectedPet)}
                className="flex-1 rounded-xl bg-blue-500 py-3 font-medium text-white hover:bg-blue-600"
              >
                연결 요청하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} fullWidth>
      <div className="flex h-[90vh] flex-col">
        {renderHeader()}
        <div ref={contentRef} className="relative flex-1">
          {step === 1 ? renderStep1() : renderStep2()}
        </div>
      </div>
    </BottomSheet>
  );
}

const PET_LIST: PetSummaryDto[] = [
  {
    name: "꼬키",
    petId: "wjief",
    morphs: ["릴리화이트", "아잔틱헷100"],
    traits: ["풀핀", "쿼드", "크림시클"],
    sex: "M",
    owner: "owner",
  },
  {
    name: "실바나스",
    petId: "wjief12",
    morphs: ["릴리화이트", "아잔틱헷100"],
    traits: ["풀핀", "쿼드", "크림시클"],
    sex: "M",
    owner: "owner",
  },
  {
    name: "베네딕토",
    petId: "wjief13",
    morphs: ["릴리화이트", "아잔틱헷100"],
    traits: ["풀핀", "쿼드", "엠티백"],
    sex: "M",
    owner: "owner",
  },
  {
    name: "대파",
    petId: "wjief14",
    morphs: ["릴리화이트", "아잔틱헷100"],
    traits: ["풀핀", "쿼드", "엠티백"],
    sex: "M",
    owner: "owner",
  },
  {
    name: "몽실",
    petId: "wjief15",
    morphs: ["릴리화이트"],
    traits: ["풀핀", "쿼드", "엠티백"],
    sex: "M",
    owner: "owner",
  },
  {
    name: "사이",
    petId: "wjief16",
    morphs: ["릴리화이트"],
    traits: ["풀핀", "쿼드", "엠티백"],
    sex: "M",
    owner: "owner",
  },
];
