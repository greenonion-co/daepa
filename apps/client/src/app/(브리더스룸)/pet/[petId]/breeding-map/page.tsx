"use client";

import { use, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import FamilyTreeCanvas from "./components/FamilyTreeCanvas";
import { useAuth } from "@/hooks/useAuth";
import { useIsMyPet } from "@/hooks/useIsMyPet";
import { UserProfileDtoRole, petControllerFindPetByPetId } from "@repo/api-client";
import { useQuery } from "@tanstack/react-query";
import { useAppRouter } from "@/hooks/useAppRouter";
import { toast } from "@/lib/toast";

interface FamilyTreePageProps {
  params: Promise<{
    petId: string;
  }>;
}

export default function FamilyTreePage({ params }: FamilyTreePageProps) {
  const { petId } = use(params);
  const { isLoggedIn, user } = useAuth();
  const router = useAppRouter();

  const { data: pet } = useQuery({
    queryKey: ["pet", petId],
    queryFn: () => petControllerFindPetByPetId(petId),
    select: (response) => response.data.data,
    enabled: isLoggedIn,
  });

  const isBreeder =
    user?.role === UserProfileDtoRole.BREEDER || user?.role === UserProfileDtoRole.ADMIN;
  const isMyPet = useIsMyPet(pet?.owner?.userId);

  useEffect(() => {
    if (!isLoggedIn) {
      toast.error("로그인이 필요합니다.");
      router.replace(`/pet/${petId}`);
      return;
    }
    if (user && !isBreeder) {
      toast.error("브리더 회원만 이용할 수 있는 기능입니다.");
      router.replace(`/pet/${petId}`);
      return;
    }
    if (pet && !isMyPet) {
      toast.error("본인 소유의 펫만 조회할 수 있습니다.");
      router.replace(`/pet/${petId}`);
    }
  }, [isLoggedIn, user, isBreeder, pet, isMyPet, petId, router]);

  if (!isLoggedIn || !isBreeder || (pet && !isMyPet)) {
    return null;
  }

  return (
    <div className="relative flex h-dvh flex-col">
      {/* 상단 헤더 */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          }}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </button>
        <span className="text-xs text-blue-600 min-sm:text-sm dark:text-blue-200">
          * 처음 부모+2세대 표시 · 클릭으로 확장 가능
        </span>
      </div>

      {/* 캔버스 */}
      <div className="flex-1">
        <FamilyTreeCanvas petId={petId} />
      </div>
    </div>
  );
}
