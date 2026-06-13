"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  petControllerCreate,
  petControllerFindAll,
  type CreatePetDto,
  type CreatePetDtoSpecies,
  type CreateParentDtoRole,
  PetDtoSex,
  PetDtoSpecies,
} from "@repo/api-client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import ConfirmDialog from "@/app/(브리더스룸)/components/Form/Dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import NameDuplicateCheckInput from "@/app/(브리더스룸)/components/NameDuplicateCheckInput";
import SingleSelect from "@/app/(브리더스룸)/components/selector/SingleSelect";
import FormMultiSelect from "@/app/(브리더스룸)/components/FormMultiSelect";
import DndImagePicker from "@/app/(브리더스룸)/components/Form/DndImagePicker";
import NumberField from "@/app/(브리더스룸)/components/Form/NumberField";
import ParentSearchSelector from "@/app/(브리더스룸)/components/selector/parentSearch";
import { useNameStore } from "@/app/(브리더스룸)/store/name";
import { usePetStore } from "@/app/(브리더스룸)/pet/store/pet";
import { type PetParentDtoWithMessage } from "@/app/(브리더스룸)/pet/store/parentLink";
import {
  DUPLICATE_CHECK_STATUS,
  MORPH_LIST_BY_SPECIES,
  TRAIT_LIST_BY_SPECIES,
  SELECTOR_CONFIGS,
} from "@/app/(브리더스룸)/constants";
import { toast } from "@/lib/toast";
import { overlay } from "overlay-kit";
import { CalendarIcon, Search } from "lucide-react";
import { DateTime } from "luxon";

const DESC_MAX_LENGTH = 500;

type PhotoItem = {
  fileName: string;
  size: number;
  mimeType: string;
  url: string;
};

const FOOD_DISPLAY_MAP = Object.fromEntries(
  SELECTOR_CONFIGS.foods.selectList.map(({ key, value }) => [key, value]),
);

interface QuickRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (petId: string) => void;
  /**
   * 제공되면 펫을 즉시 생성하지 않고 작성된 DTO 만 호출자에게 전달.
   * 경매 생성 흐름처럼 후속 단계에서 펫 생성을 함께 수행해야 할 때 사용.
   * onSubmitDraft 가 있으면 onSuccess 는 무시된다.
   */
  onSubmitDraft?: (dto: CreatePetDto) => void;
}

export default function QuickRegisterModal({
  isOpen,
  onClose,
  onSuccess,
  onSubmitDraft,
}: QuickRegisterModalProps) {
  const { duplicateCheckStatus, setDuplicateCheckStatus } = useNameStore();
  const { setErrors } = usePetStore();

  // Step
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [name, setName] = useState("");
  const [sex, setSex] = useState<"M" | "F" | "N" | null>("M");
  const [morphs, setMorphs] = useState<string[]>([]);
  const [traits, setTraits] = useState<string[]>([]);
  const [desc, setDesc] = useState("");

  // Step 2 fields
  const [father, setFather] = useState<PetParentDtoWithMessage | null>(null);
  const [mother, setMother] = useState<PetParentDtoWithMessage | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [hatchingDate, setHatchingDate] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [foods, setFoods] = useState<string[]>([]);

  const { mutateAsync: createPet, isPending } = useMutation({
    mutationFn: petControllerCreate,
  });

  const resetForm = useCallback(() => {
    setName("");
    setSex("M");
    setMorphs([]);
    setTraits([]);
    setDesc("");
    setStep(1);
    setFather(null);
    setMother(null);
    setPhotos([]);
    setHatchingDate("");
    setWeight("");
    setFoods([]);
    setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.NONE);
    setErrors({ name: "" });
  }, [setDuplicateCheckStatus, setErrors]);

  const isDirty =
    name !== "" ||
    morphs.length > 0 ||
    traits.length > 0 ||
    desc !== "" ||
    father !== null ||
    mother !== null ||
    photos.length > 0 ||
    hatchingDate !== "" ||
    weight !== "" ||
    foods.length > 0;

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        if (isDirty) {
          overlay.open(({ isOpen, close, unmount }) => (
            <ConfirmDialog
              isOpen={isOpen}
              title="작성을 취소하시겠습니까?"
              description="입력한 내용이 모두 사라집니다."
              onCloseAction={close}
              onConfirmAction={() => {
                handleClose();
                close();
              }}
              onExit={unmount}
              cancelText="계속 작성"
              confirmText="나가기"
            />
          ));
        } else {
          handleClose();
        }
      }
    },
    [isDirty, handleClose],
  );

  const isSubmitDisabled =
    isPending ||
    !name ||
    !sex ||
    morphs.length === 0 ||
    duplicateCheckStatus !== DUPLICATE_CHECK_STATUS.AVAILABLE;

  const handleSubmit = useCallback(async () => {
    if (!name || !sex || morphs.length === 0) return;
    if (duplicateCheckStatus !== DUPLICATE_CHECK_STATUS.AVAILABLE) return;

    const dto: CreatePetDto = {
      species: "CR" as CreatePetDtoSpecies,
      name,
      sex,
      morphs,
      ...(traits.length > 0 && { traits }),
      ...(desc && { desc }),
      ...(hatchingDate && { hatchingDate }),
      ...(weight && { weight: Number(weight) }),
      ...(foods.length > 0 && { foods }),
      ...(photos.length > 0 && { photos }),
      ...(father && {
        father: {
          parentId: father.petId,
          role: "father" as CreateParentDtoRole,
        },
      }),
      ...(mother && {
        mother: {
          parentId: mother.petId,
          role: "mother" as CreateParentDtoRole,
        },
      }),
    };

    // Draft 모드 — 펫 생성은 호출자가 처리.
    if (onSubmitDraft) {
      onSubmitDraft(dto);
      resetForm();
      onClose();
      return;
    }

    try {
      await createPet(dto);

      // 생성된 개체의 petId 조회
      const searchResult = await petControllerFindAll({
        keyword: name,
        filterType: "MY",
        itemPerPage: 5,
      });
      const newPet = (searchResult.data.data ?? []).find((p: { name?: string }) => p.name === name);

      toast.success("개체가 등록되었습니다.");
      resetForm();
      onClose();
      if (newPet) onSuccess?.(newPet.petId);
    } catch {
      toast.error("개체 등록에 실패했습니다.");
    }
  }, [
    name,
    sex,
    morphs,
    traits,
    desc,
    hatchingDate,
    weight,
    foods,
    photos,
    father,
    mother,
    duplicateCheckStatus,
    createPet,
    resetForm,
    onClose,
    onSuccess,
    onSubmitDraft,
  ]);

  const handleGoToStep2 = useCallback(() => {
    if (isSubmitDisabled) return;
    setStep(2);
  }, [isSubmitDisabled]);

  const handleOpenParentSearch = useCallback(
    (parentSex: "M" | "F", onSelect: (pet: PetParentDtoWithMessage) => void) => {
      overlay.open(({ isOpen: overlayOpen, close, unmount }) => (
        <ParentSearchSelector
          isOpen={overlayOpen}
          onClose={close}
          species={PetDtoSpecies.CRESTED}
          sex={parentSex === "M" ? PetDtoSex.MALE : PetDtoSex.FEMALE}
          onSelect={(pet) => {
            onSelect(pet as PetParentDtoWithMessage);
            close();
          }}
          onExit={unmount}
          onlySelect
        />
      ));
    },
    [],
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-[440px] overflow-y-auto rounded-2xl p-6 dark:bg-neutral-800">
        <DialogTitle className="text-[16px] font-semibold dark:text-gray-100">
          {step === 1 ? "빠른 개체 등록" : "추가 정보 입력"}
        </DialogTitle>

        {/* step 1 본문은 언마운트하지 않고 숨김 처리 — 입력(NameDuplicateCheckInput)이
            remount되며 중복확인 상태가 풀리는 것을 방지 (단계 왕복 시 상태 유지) */}
        <div className={step === 1 ? "mt-2 space-y-4" : "hidden"}>
            {/* 이름 */}
            <div className="flex w-fit items-center">
              <label className="block min-w-10 text-[13px] font-medium text-gray-700 dark:text-gray-300">
                이름 <span className="text-red-500">*</span>
              </label>
              <NameDuplicateCheckInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="개체 이름 입력"
              />
            </div>

            {/* 성별 */}
            <div className="flex w-fit items-center">
              <label className="block min-w-10 text-[13px] font-medium text-gray-700 dark:text-gray-300">
                성별 <span className="text-red-500">*</span>
              </label>
              <SingleSelect
                type="sex"
                initialItem={sex}
                onSelect={(v: "M" | "F" | null) => setSex(v)}
                variant="form"
                forceCenter
              />
            </div>

            {/* 모프 */}
            <div className="flex w-fit items-center">
              <label className="block min-w-10 text-[13px] font-medium text-gray-700 dark:text-gray-300">
                모프 <span className="text-red-500">*</span>
              </label>
              <FormMultiSelect
                title="모프"
                displayMap={MORPH_LIST_BY_SPECIES.CR}
                initialItems={morphs}
                onSelect={(items) => setMorphs(items ?? [])}
                forceCenter
              />
            </div>

            {/* 형질 */}
            <div className="flex w-fit items-center">
              <label className="block min-w-10 text-[13px] font-medium text-gray-700 dark:text-gray-300">
                형질
              </label>
              <FormMultiSelect
                title="형질"
                displayMap={TRAIT_LIST_BY_SPECIES.CR}
                initialItems={traits}
                onSelect={(items) => setTraits(items ?? [])}
                forceCenter
              />
            </div>

            {/* 해칭일 */}
            <div className="flex w-fit items-center">
              <label className="block min-w-12 text-[13px] font-medium text-gray-700 dark:text-gray-300">
                해칭일
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-full items-center justify-between rounded-lg border border-gray-200 px-3 text-left text-sm dark:border-gray-700 dark:bg-[#18171C] dark:text-white"
                  >
                    <span
                      className={hatchingDate ? "text-gray-900 dark:text-white" : "text-gray-400"}
                    >
                      {hatchingDate
                        ? DateTime.fromISO(hatchingDate).toFormat("yyyy년 MM월 dd일")
                        : "해칭일을 선택해주세요"}
                    </span>
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={hatchingDate ? new Date(hatchingDate) : undefined}
                    onSelect={(date) => {
                      if (date) setHatchingDate(date.toISOString());
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
        </div>
        {step === 2 && (
          <div className="mt-2 space-y-4">
            {/* 부모 정보 */}
            <div>
              <label className="mb-1 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
                부모 정보
              </label>
              <div className="flex gap-2">
                <ParentSelectButton
                  label="부"
                  selected={father}
                  onSelect={(pet) => setFather(pet)}
                  onClear={() => setFather(null)}
                  onOpenSearch={() => handleOpenParentSearch("M", setFather)}
                />
                <ParentSelectButton
                  label="모"
                  selected={mother}
                  onSelect={(pet) => setMother(pet)}
                  onClear={() => setMother(null)}
                  onOpenSearch={() => handleOpenParentSearch("F", setMother)}
                />
              </div>
            </div>

            {/* 사진 */}
            <div>
              <label className="mb-1 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
                사진
              </label>
              <DndImagePicker images={photos} onChange={setPhotos} max={3} />
            </div>

            {/* 체중 */}
            <div className="flex w-fit items-center">
              <label className="block min-w-12 text-[13px] font-medium text-gray-700 dark:text-gray-300">
                체중
              </label>
              <NumberField
                inputClassName="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm text-left focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-[#18171C] dark:text-white"
                field={{ name: "weight", type: "number", unit: "g" }}
                value={weight}
                setValue={({ value: v }) => setWeight(v)}
                placeholder="체중을 입력해주세요"
              />
            </div>

            {/* 먹이 */}
            <div className="flex w-fit items-center">
              <label className="block min-w-12 text-[13px] font-medium text-gray-700 dark:text-gray-300">
                먹이
              </label>
              <FormMultiSelect
                title="먹이"
                displayMap={FOOD_DISPLAY_MAP}
                initialItems={foods}
                onSelect={(items) => setFoods(items ?? [])}
                forceCenter
              />
            </div>

            {/* 상세 설명 */}
            <div>
              <label className="mb-1 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
                상세 설명
              </label>
              <div className="relative">
                <textarea
                  className="min-h-[120px] w-full rounded-xl bg-gray-100 p-4 text-left text-sm focus:ring-0 focus:outline-none dark:bg-[#18171C] dark:text-white"
                  rows={3}
                  maxLength={DESC_MAX_LENGTH}
                  placeholder="개체에 대한 설명을 입력해주세요"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
                <span className="absolute right-3 bottom-2 text-xs text-gray-400">
                  {desc.length}/{DESC_MAX_LENGTH}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 하단 버튼 */}
        {step === 1 ? (
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className="w-full rounded-xl bg-black py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              {onSubmitDraft ? "다음" : isPending ? "등록 중..." : "등록"}
            </button>
            <button
              type="button"
              onClick={handleGoToStep2}
              disabled={isSubmitDisabled}
              className="w-full rounded-xl border border-blue-600 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-900/20"
            >
              상세 정보 입력
            </button>
          </div>
        ) : (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-gray-700dark:bg-gray-700 flex-1 rounded-xl bg-gray-200 py-2.5 text-sm font-medium dark:bg-gray-700 dark:text-gray-200"
            >
              이전
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="flex-1 rounded-xl bg-black py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              {onSubmitDraft ? "다음" : isPending ? "등록 중..." : "등록"}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** 부/모 선택 버튼 */
function ParentSelectButton({
  label,
  selected,
  onClear,
  onOpenSearch,
}: {
  label: "부" | "모";
  selected: PetParentDtoWithMessage | null;
  onSelect: (pet: PetParentDtoWithMessage) => void;
  onClear: () => void;
  onOpenSearch: () => void;
}) {
  if (selected) {
    return (
      <div className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-blue-200 bg-blue-50/50 p-2 dark:border-blue-800 dark:bg-blue-900/10">
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
        <span className="max-w-full truncate text-sm font-medium text-gray-800 dark:text-gray-200">
          {selected.name}
        </span>
        <button type="button" onClick={onClear} className="text-xs text-red-500 hover:text-red-600">
          해제
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenSearch}
      className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-dashed border-gray-300 p-3 text-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
    >
      <Search className="h-5 w-5" />
      <span className="text-xs">{label}</span>
    </button>
  );
}
