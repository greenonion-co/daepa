import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { useMemo, useState } from "react";
import { LayingByDateDto, PetDtoSpecies } from "@repo/api-client";
import { Info } from "lucide-react";
import { format, addDays } from "date-fns";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SPECIES_KOREAN_INFO } from "../../constants";
import CalendarSelect from "./CalendarSelect";
import { useCreateLaying } from "../hooks/useCreateLaying";

/**
 * 산란 생성 모달 Props
 */
interface CreateLayingModalProps {
  /** 모달 열림 상태 */
  isOpen: boolean;
  /** 닫기 콜백 */
  onClose: () => void;
  /** 메이팅 ID */
  matingId: number;
  /** 메이팅 날짜 (산란일 선택 범위 제한용) */
  matingDate?: string;
  /** 아버지 ID */
  fatherId?: string;
  /** 어머니 ID */
  motherId?: string;
  /** 기존 산란 데이터 (차수 및 날짜 제한용) */
  layingData?: LayingByDateDto[];
  /** 생성 성공 시 콜백 (선택) */
  onCreateSuccess?: () => void;
}

/**
 * YYYYMMDD 형식의 날짜 문자열을 Date 객체로 변환
 * @param dateString - YYYYMMDD 형식의 날짜 문자열 (예: "20240101")
 * @returns Date 객체
 */
const parseLayingDate = (dateString: string | number): Date => {
  const str = dateString.toString();
  const formatted = str.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
  return new Date(formatted);
};

/**
 * 산란 생성 모달
 *
 * @description
 * - Single Responsibility: UI 렌더링 + 폼 상태 관리만
 * - Open/Closed: onCreateSuccess로 확장 가능
 * - Dependency Inversion: 비즈니스 로직은 useCreateLaying에 위임
 *
 * @example
 * ```tsx
 * <CreateLayingModal
 *   isOpen={true}
 *   onClose={() => {}}
 *   matingId={1}
 *   matingDate="20240101"
 *   fatherId="father-id"
 *   motherId="mother-id"
 *   layingData={[]}
 *   onCreateSuccess={() => console.log('생성 완료')}
 * />
 * ```
 */
const CreateLayingModal = ({
  isOpen,
  onClose,
  matingId,
  matingDate,
  layingData,
  fatherId,
  motherId,
  onCreateSuccess,
}: CreateLayingModalProps) => {
  // 마지막 산란일 계산
  const lastLayingDate = useMemo(
    () => layingData?.[layingData.length - 1]?.layingDate,
    [layingData],
  );

  // 최대 차수 계산
  const maxClutch = useMemo(() => {
    if (!layingData || layingData.length === 0) return 0;
    const clutches = layingData
      .map((laying) => laying.layings?.[0]?.clutch as number | undefined)
      .filter((clutch): clutch is number => clutch !== undefined && clutch !== null);
    return clutches.length > 0 ? Math.max(...clutches) : 0;
  }, [layingData]);

  // 기본 산란일 계산 (마지막 산란일 + 1일 or 오늘)
  const defaultLayingDate = useMemo(() => {
    if (!lastLayingDate) {
      return new Date().toISOString();
    }

    // 마지막 산란일에서 1일 추가
    const lastDate = parseLayingDate(lastLayingDate);
    return addDays(lastDate, 1).toISOString();
  }, [lastLayingDate]);

  // 폼 상태 관리
  const [formData, setFormData] = useState<{
    species: PetDtoSpecies;
    layingDate: string;
    clutchCount: string;
    temperature: string;
    clutch: string;
  }>({
    species: PetDtoSpecies.CRESTED,
    layingDate: defaultLayingDate,
    clutchCount: "2",
    temperature: "25",
    clutch: layingData?.length ? (layingData.length + 1).toString() : "1",
  });

  // 비즈니스 로직은 커스텀 훅에 위임
  const { createLaying, isPending } = useCreateLaying({
    onSuccess: () => {
      onClose();
      onCreateSuccess?.();
    },
  });

  /**
   * 폼 제출 핸들러 (검증 + 호출만)
   */
  const handleSubmit = async () => {
    // 클라이언트 검증
    if (!formData.species) {
      toast.error("종은 필수 입력 항목입니다.");
      return;
    }

    if (!formData.layingDate) {
      toast.error("산란일은 필수 입력 항목입니다.");
      return;
    }

    if (!formData.clutchCount) {
      toast.error("산란 수는 필수 입력 항목입니다.");
      return;
    }

    // 비즈니스 로직 실행
    try {
      await createLaying({
        matingId,
        layingDate: format(new Date(formData.layingDate), "yyyy-MM-dd"),
        species: formData.species,
        clutchCount: parseInt(formData.clutchCount, 10),
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        clutch: formData.clutch ? parseInt(formData.clutch, 10) : undefined,
        motherId,
        fatherId,
      });
    } catch {
      // 에러는 useCreateLaying에서 처리됨
    }
  };

  /**
   * 날짜 선택 제한 함수
   * - matingDate보다 이전 날짜는 선택 불가
   * - lastLayingDate와 같거나 이전 날짜는 선택 불가
   */
  const isDateDisabled = (date: Date) => {
    const selectedDate = new Date(format(date, "yyyy-MM-dd"));

    // matingDate 이후 조건
    if (matingDate && selectedDate < parseLayingDate(matingDate)) {
      return true;
    }

    // lastLayingDate 이후 조건
    if (lastLayingDate && selectedDate <= parseLayingDate(lastLayingDate)) {
      return true;
    }

    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>산란 정보 추가</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="species">종</Label>
            <Select
              disabled
              value={formData.species}
              onValueChange={(value: PetDtoSpecies) =>
                setFormData((prev) => ({ ...prev, species: value }))
              }
            >
              <SelectTrigger className="col-span-3 w-full text-[16px]">
                <SelectValue placeholder="종을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(PetDtoSpecies).map((species) => (
                  <SelectItem key={species} value={species} className="text-[16px]">
                    {SPECIES_KOREAN_INFO[species]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label>산란일</Label>
            <div className="col-span-3">
              <CalendarSelect
                type="edit"
                triggerText={
                  formData.layingDate
                    ? format(new Date(formData.layingDate), "yyyy년 MM월 dd일")
                    : "산란일"
                }
                confirmButtonText="선택 완료"
                disabledDates={layingData?.map((laying) => laying.layingDate) ?? []}
                onConfirm={(date) => {
                  if (!date) return;
                  setFormData((prev) => ({
                    ...prev,
                    layingDate: date,
                  }));
                }}
                disabled={isDateDisabled}
                initialDate={formData.layingDate}
              />

              {lastLayingDate && (
                <div className="mt-1 text-sm">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Info className="h-4 w-4" /> 이전 산란일 이후 날짜만 선택 가능합니다.
                  </div>
                  <div className="font-semibold text-blue-500">
                    마지막 산란일: {format(parseLayingDate(lastLayingDate), "yyyy년 MM월 dd일")}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clutch">차수</Label>
            <div className="col-span-3 flex flex-col gap-1">
              <Input
                id="clutch"
                type="number"
                min={maxClutch + 1}
                placeholder="차수를 입력하세요"
                value={formData.clutch}
                onChange={(e) => setFormData((prev) => ({ ...prev, clutch: e.target.value }))}
              />
              {maxClutch > 0 && (
                <div className="col-span-3">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Info className="h-4 w-4" /> 가장 마지막 차수는 {maxClutch}차 입니다.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clutchCount">알 개수</Label>
            <Input
              id="clutchCount"
              type="number"
              min="1"
              placeholder="알 개수를 입력하세요"
              value={formData.clutchCount}
              onChange={(e) => setFormData((prev) => ({ ...prev, clutchCount: e.target.value }))}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="temperature">온도</Label>
            <Input
              id="temperature"
              type="number"
              step="0.1"
              placeholder="온도를 입력하세요"
              value={formData.temperature}
              onChange={(e) => setFormData((prev) => ({ ...prev, temperature: e.target.value }))}
              className="col-span-3"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            className="h-[32px] cursor-pointer rounded-lg bg-gray-100 px-3 text-sm font-semibold text-gray-600 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onClose}
            disabled={isPending}
          >
            취소
          </button>
          <button
            className="h-[32px] cursor-pointer rounded-lg bg-blue-500 px-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? "처리 중..." : "추가"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLayingModal;
