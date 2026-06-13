"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { Info } from "lucide-react";
import {
  petControllerCreate,
  petControllerFindAll,
  petControllerFindPetByPetId,
  type CreatePetDto,
  type PetDto,
} from "@repo/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { createAuction } from "../api";

// `<input type="datetime-local">` 가 요구하는 포맷
const DATETIME_LOCAL_FORMAT = "yyyy-LL-dd'T'HH:mm";
const toLocalInputValue = (dt: DateTime) => dt.toFormat(DATETIME_LOCAL_FORMAT);

interface CreateAuctionFormProps {
  /** 폼에 미리 채워둘 펫 ID */
  initialPetId?: string;
  /** true 이면 펫 ID 인풋을 읽기전용으로 잠금 (펫 상세에서 모달로 띄울 때 사용) */
  lockPetId?: boolean;
  /** 생성 후 사용자가 모달/페이지를 닫고 싶을 때 호출 (모달 환경에서 전달). */
  onClose?: () => void;
  /** 제공되면 '이전' 버튼을 표시하고 클릭 시 호출 (직전 단계로 복귀). */
  onBack?: () => void;
  /**
   * 제공되면 "경매 생성" 클릭 시 이 DTO 로 펫을 isPublic=true 로 먼저 생성하고
   * 그 petId 로 경매를 만든다. 사용자가 폼을 그대로 닫으면 펫도 만들어지지 않는다.
   * 경매 생성이 실패해도 이미 만들어진 펫은 유지하고 createdPetId 로 재시도를 허용한다.
   */
  pendingPet?: CreatePetDto;
}

const HelperText = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-1 flex items-center gap-1">
    <Info size={14} className="text-gray-400 dark:text-gray-500" />
    <span className="text-xs text-gray-400 dark:text-gray-500">{children}</span>
  </div>
);

// 항목명(라벨) 위, 항목값(content) 아래로 세로 배치하는 form row.
const FieldRow = ({
  label,
  content,
  subContent,
}: {
  label: string;
  content: React.ReactNode;
  subContent?: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-[13px] font-[500] text-gray-600 dark:text-gray-300">{label}</span>
    <div>{content}</div>
    {subContent}
  </div>
);

export function CreateAuctionForm({
  initialPetId = "",
  lockPetId = false,
  onClose,
  onBack,
  pendingPet,
}: CreateAuctionFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const startDefault = DateTime.now().plus({ minutes: 5 });
  const endDefault = startDefault.plus({ hours: 1 });

  const [petId, setPetId] = useState(initialPetId);
  // pendingPet 모드에서 펫 생성이 성공한 뒤 그 petId 를 저장 — 경매 생성 실패 후 재시도 시
  // 펫 재생성으로 인한 UNIQUE_OWNER_PET_NAME 충돌을 피한다.
  const [createdPetId, setCreatedPetId] = useState<string | null>(null);
  const [startingPrice, setStartingPrice] = useState<string>("0");
  const [minIncrement, setMinIncrement] = useState<string>("1000");
  const [extensionMinutes, setExtensionMinutes] = useState<string>("1");
  const [startTime, setStartTime] = useState<string>(toLocalInputValue(startDefault));
  const [endTime, setEndTime] = useState<string>(toLocalInputValue(endDefault));
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{
    shareUrl: string;
    shareToken: string;
  } | null>(null);

  // pendingPet 모드: 사용자가 인풋에서 볼 이름은 작성한 DTO 의 name.
  // lockPetId 모드: 서버에서 펫 이름 조회. (이미 존재하는 펫)
  const { data: petResponse } = useQuery({
    queryKey: [petControllerFindPetByPetId.name, petId],
    queryFn: () => petControllerFindPetByPetId(petId),
    enabled: lockPetId && !!petId && !pendingPet,
    staleTime: 5 * 60 * 1000,
  });
  const petName = pendingPet?.name ?? petResponse?.data?.data?.name ?? "";
  const isPetInputLocked = lockPetId || !!pendingPet;

  // 시작 시각이 종료 시각을 추월하면 종료 시각을 자동으로 +1시간 으로 보정.
  useEffect(() => {
    const sDt = DateTime.fromISO(startTime);
    const eDt = DateTime.fromISO(endTime);
    if (sDt.isValid && eDt.isValid && eDt <= sDt) {
      setEndTime(toLocalInputValue(sDt.plus({ hours: 1 })));
    }
    // endTime 은 의도적으로 deps 제외 — startTime 변경 시점에만 보정.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime]);

  // datetime-local 인풋 박스 안을 직접 클릭/탭했을 때만 native picker 를 즉시 띄움.
  // Label(htmlFor) 클릭으로 인한 synthetic click 은 e.detail === 0 이라 무시 → 라벨 영역에서는 트리거되지 않음.
  // showPicker 는 user activation 컨텍스트에서만 동작.
  const openDateTimePicker = (e: React.MouseEvent<HTMLInputElement>) => {
    if (e.detail === 0) return;
    const el = e.currentTarget as HTMLInputElement & {
      showPicker?: () => void;
    };
    try {
      el.showPicker?.();
    } catch {
      // 일부 브라우저에서 user-activation 미달 시 throw — 무시 (기본 동작 fallback)
    }
  };

  const handleSubmit = async () => {
    // 경매 파라미터를 먼저 검증 — 검증 실패 시 펫이 만들어지지 않도록.
    const sDt = DateTime.fromISO(startTime);
    const eDt = DateTime.fromISO(endTime);
    if (!sDt.isValid || !eDt.isValid) {
      toast.error("시작/종료 시각이 올바르지 않습니다.");
      return;
    }
    const startMs = sDt.toMillis();
    const endMs = eDt.toMillis();
    if (endMs <= startMs) {
      toast.error("종료 시각은 시작 시각 이후여야 합니다.");
      return;
    }
    if (endMs - startMs < 5 * 60 * 1000) {
      toast.error("경매 길이는 최소 5분 이상이어야 합니다.");
      return;
    }
    const ext = Number(extensionMinutes);
    if (!Number.isInteger(ext) || ext < 1 || ext > 10) {
      toast.error("연장 분은 1~10분 사이의 정수여야 합니다.");
      return;
    }
    if (ext * 60_000 * 2 >= endMs - startMs) {
      toast.error("연장 시간이 경매 길이의 절반 이상입니다.");
      return;
    }

    if (!pendingPet && !petId.trim()) {
      toast.error("펫 ID를 입력하세요.");
      return;
    }

    setSubmitting(true);
    try {
      // pendingPet 모드: 아직 생성하지 않았다면 공개 펫으로 생성하고 petId 조회.
      let effectivePetId = createdPetId ?? petId.trim();
      if (pendingPet && !createdPetId) {
        try {
          await petControllerCreate({ ...pendingPet, isPublic: true });
        } catch (err) {
          const e = err as { response?: { data?: { message?: string } }; message?: string };
          toast.error(e.response?.data?.message ?? "개체 생성에 실패했습니다.");
          return;
        }

        const searchResult = await petControllerFindAll({
          keyword: pendingPet.name ?? "",
          filterType: "MY",
          itemPerPage: 5,
        });
        const newPet = (searchResult.data?.data ?? []).find(
          (p: PetDto) => p.name === pendingPet.name,
        );
        if (!newPet) {
          toast.error("생성된 개체를 찾지 못했습니다. 다시 시도해주세요.");
          return;
        }
        setCreatedPetId(newPet.petId);
        effectivePetId = newPet.petId;
        // 새 펫이 목록 캐시에 반영되도록.
        queryClient.invalidateQueries({ queryKey: [petControllerFindAll.name] });
        // 펫이 만들어졌음을 알린다 — 이 시점에 사용자가 다이얼로그를 닫더라도 펫은 보존됨.
        toast.success("개체가 등록되었습니다. 계속해서 경매를 생성합니다.");
      }

      const data = await createAuction({
        petId: effectivePetId,
        startingPrice: Number(startingPrice),
        minIncrement: Number(minIncrement),
        extensionMinutes: ext,
        startTime: sDt.toUTC().toISO() ?? "",
        endTime: eDt.toUTC().toISO() ?? "",
      });
      toast.success("경매가 생성되었습니다.");
      setCreated({ shareUrl: data.shareUrl, shareToken: data.shareToken });
    } catch (err) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(e.response?.data?.message ?? e.message ?? "경매 생성 실패");
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[14px] text-gray-700 dark:text-gray-300">
          아래 링크를 공유해 경매를 시작하세요.
        </p>
        <div className="flex gap-2">
          <Input readOnly value={created.shareUrl} />
          <Button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(created.shareUrl);
                toast.success("링크가 복사되었습니다.");
              } catch {
                toast.error("복사 실패");
              }
            }}
          >
            복사
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              router.push(`/auction/${created.shareToken}`);
              onClose?.();
            }}
          >
            경매 페이지로 이동
          </Button>
          <Button variant="outline" onClick={() => setCreated(null)}>
            다시 만들기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <FieldRow
        label="개체"
        content={
          <Input
            id="petId"
            value={isPetInputLocked ? petName : petId}
            onChange={(e) => setPetId(e.target.value)}
            placeholder={isPetInputLocked ? "" : "개체 ID"}
            readOnly={isPetInputLocked}
            disabled={isPetInputLocked}
            className="text-[13px]"
          />
        }
        subContent={
          pendingPet ? (
            <HelperText>
              경매를 위해 개체는 공개 상태로 등록됩니다. 공개 한도가 초과되면 기존 공개 개체 중
              일부가 비공개로 전환될 수 있습니다.
            </HelperText>
          ) : undefined
        }
      />

      <FieldRow
        label="시작가"
        content={
          <Input
            id="startingPrice"
            type="number"
            value={startingPrice}
            onChange={(e) => setStartingPrice(e.target.value)}
            min={0}
            step={100}
            className="text-[13px]"
          />
        }
      />

      <FieldRow
        label="입찰 단위"
        content={
          <Input
            id="minIncrement"
            type="number"
            value={minIncrement}
            onChange={(e) => setMinIncrement(e.target.value)}
            min={100}
            step={100}
            className="text-[13px]"
          />
        }
      />

      <FieldRow
        label="연장 분"
        content={
          <Input
            id="extensionMinutes"
            type="number"
            value={extensionMinutes}
            onChange={(e) => setExtensionMinutes(e.target.value)}
            min={1}
            max={10}
            className="text-[13px]"
          />
        }
        subContent={<HelperText>마지막 입찰 시 종료 시각을 N분 뒤로 자동 연장 (1~10).</HelperText>}
      />

      <FieldRow
        label="시작 시각"
        content={
          <Input
            id="startTime"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            onClick={openDateTimePicker}
            className="w-full text-[13px]"
          />
        }
      />

      <FieldRow
        label="종료 시각"
        content={
          <Input
            id="endTime"
            type="datetime-local"
            value={endTime}
            min={startTime}
            onChange={(e) => setEndTime(e.target.value)}
            onClick={openDateTimePicker}
            className="w-full text-[13px]"
          />
        }
      />

      <div className="mt-2 flex gap-2">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={submitting}
            className="flex-1"
          >
            이전
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
        >
          {submitting ? "생성 중..." : "경매 생성"}
        </Button>
      </div>
    </div>
  );
}
