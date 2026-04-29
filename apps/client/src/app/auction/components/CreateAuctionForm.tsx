"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { petControllerFindPetByPetId } from "@repo/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { createAuction } from "../api";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

interface CreateAuctionFormProps {
  /** 폼에 미리 채워둘 펫 ID */
  initialPetId?: string;
  /** true 이면 펫 ID 인풋을 읽기전용으로 잠금 (펫 상세에서 모달로 띄울 때 사용) */
  lockPetId?: boolean;
  /** 생성 후 사용자가 모달/페이지를 닫고 싶을 때 호출 (모달 환경에서 전달). */
  onClose?: () => void;
}

export function CreateAuctionForm({
  initialPetId = "",
  lockPetId = false,
  onClose,
}: CreateAuctionFormProps) {
  const router = useRouter();

  const now = new Date();
  const startDefault = new Date(now.getTime() + 5 * 60 * 1000);
  const oneHourLater = new Date(startDefault.getTime() + 60 * 60 * 1000);

  const [petId, setPetId] = useState(initialPetId);
  const [startingPrice, setStartingPrice] = useState<string>("0");
  const [minIncrement, setMinIncrement] = useState<string>("1000");
  const [extensionMinutes, setExtensionMinutes] = useState<string>("5");
  const [startTime, setStartTime] = useState<string>(toLocalInputValue(startDefault));
  const [endTime, setEndTime] = useState<string>(toLocalInputValue(oneHourLater));
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{
    shareUrl: string;
    shareToken: string;
  } | null>(null);

  // 사용자에게 ID 를 노출하지 않기 위해, lockPetId 모드일 때는 펫 이름을 조회해 표시.
  const { data: petResponse } = useQuery({
    queryKey: [petControllerFindPetByPetId.name, petId],
    queryFn: () => petControllerFindPetByPetId(petId),
    enabled: lockPetId && !!petId,
    staleTime: 5 * 60 * 1000,
  });
  const petName = petResponse?.data?.data?.name ?? "";

  // 시작 시각이 종료 시각을 추월하면 종료 시각을 자동으로 +1시간 으로 보정.
  useEffect(() => {
    const sMs = new Date(startTime).getTime();
    const eMs = new Date(endTime).getTime();
    if (Number.isFinite(sMs) && Number.isFinite(eMs) && eMs <= sMs) {
      setEndTime(toLocalInputValue(new Date(sMs + 60 * 60 * 1000)));
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
    if (!petId.trim()) {
      toast.error("펫 ID를 입력하세요.");
      return;
    }
    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      toast.error("시작/종료 시각이 올바르지 않습니다.");
      return;
    }
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

    setSubmitting(true);
    try {
      const data = await createAuction({
        petId: petId.trim(),
        startingPrice: Number(startingPrice),
        minIncrement: Number(minIncrement),
        extensionMinutes: ext,
        startTime: new Date(startMs).toISOString(),
        endTime: new Date(endMs).toISOString(),
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
      <div className="space-y-3">
        <p className="text-sm">아래 링크를 공유해 경매를 시작하세요.</p>
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
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="petId">개체 이름</Label>
        <Input
          id="petId"
          value={lockPetId ? petName : petId}
          onChange={(e) => setPetId(e.target.value)}
          placeholder={lockPetId ? "" : "개체 ID"}
          readOnly={lockPetId}
          disabled={lockPetId}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="startingPrice">시작가 (원)</Label>
          <Input
            id="startingPrice"
            type="number"
            value={startingPrice}
            onChange={(e) => setStartingPrice(e.target.value)}
            min={0}
            step={100}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="minIncrement">최소 입찰 단위 (원)</Label>
          <Input
            id="minIncrement"
            type="number"
            value={minIncrement}
            onChange={(e) => setMinIncrement(e.target.value)}
            min={100}
            step={100}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="extensionMinutes">연장 분 (1~10)</Label>
        <Input
          id="extensionMinutes"
          type="number"
          value={extensionMinutes}
          onChange={(e) => setExtensionMinutes(e.target.value)}
          min={1}
          max={10}
        />
        <p className="text-muted-foreground text-xs">
          마감 직전 입찰 시 종료시각을 N분 뒤로 자동 연장합니다.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="startTime">시작 시각</Label>
          <Input
            id="startTime"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            onClick={openDateTimePicker}
            className="w-full"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="endTime">종료 시각</Label>
          <Input
            id="endTime"
            type="datetime-local"
            value={endTime}
            min={startTime}
            onChange={(e) => setEndTime(e.target.value)}
            onClick={openDateTimePicker}
            className="w-full"
          />
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-amber-600">
        {submitting ? "생성 중..." : "경매 생성"}
      </Button>
    </div>
  );
}
