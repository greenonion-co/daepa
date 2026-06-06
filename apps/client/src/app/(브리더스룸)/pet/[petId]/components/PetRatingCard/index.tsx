"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  petControllerFindPetByPetId,
  petControllerUpdate,
} from "@repo/api-client";
import { AxiosError } from "axios";
import { useIsMyPet } from "@/hooks/useIsMyPet";
import { toast } from "@/lib/toast";
import { RatingRadar } from "./RatingRadar";
import { EMPTY_SCORES } from "./rating.constants";

interface PetRatingCardProps {
  petId: string;
  ownerId: string | undefined;
  scores?: number[];
}

export function PetRatingCard({ petId, ownerId, scores }: PetRatingCardProps) {
  const queryClient = useQueryClient();
  const isOwner = useIsMyPet(ownerId);

  // 평가 존재 여부: 서버는 한 항목이라도 값이 있으면(0 포함) 배열을 내려주고,
  // 한 번도 평가되지 않았으면 필드를 생략한다.
  const hasRating = Array.isArray(scores);
  const saved = scores ?? EMPTY_SCORES;
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<number[]>(saved);

  // 외부 데이터(저장 후 재조회 등)가 바뀌면 편집 중이 아닐 때 동기화
  useEffect(() => {
    if (!isEditing) setDraft(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scores]);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (ratingScores: number[]) =>
      petControllerUpdate(petId, { ratingScores }),
  });

  const setScore = (index: number, next: number) => {
    setDraft((prev) => prev.map((v, i) => (i === index ? next : v)));
  };

  const handleSave = async () => {
    try {
      await mutateAsync(draft);
      await queryClient.invalidateQueries({
        queryKey: [petControllerFindPetByPetId.name, petId],
      });
      setIsEditing(false);
      toast.success("평가가 저장되었습니다.");
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message ?? "저장에 실패했습니다.");
      } else {
        toast.error("저장에 실패했습니다.");
      }
    }
  };

  const handleCancel = () => {
    setDraft(saved);
    setIsEditing(false);
  };

  // 평가가 없는 펫은 타인에게 섹션 자체를 노출하지 않음 (owner는 추가를 위해 항상 노출)
  if (!isOwner && !hasRating) return null;

  const shown = isEditing ? draft : saved;

  return (
    <div className="flex flex-1 flex-col gap-2 rounded-2xl bg-white p-3 shadow-xs dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <div className="text-[14px] font-[600] text-gray-600 dark:text-gray-300">
          개체 평가
        </div>
        {isOwner &&
          (isEditing ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                className="text-[13px] text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50 dark:hover:text-gray-300"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="text-[13px] font-[600] text-indigo-500 transition-colors hover:text-indigo-600 disabled:opacity-50"
              >
                완료
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-[13px] text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
            >
              수정
            </button>
          ))}
      </div>

      <RatingRadar scores={shown} editable={isEditing} onChange={setScore} />

      {isEditing && (
        <p className="text-center text-[12px] text-gray-400">
          꼭짓점을 끌어 점수를 조정하세요
        </p>
      )}
    </div>
  );
}
