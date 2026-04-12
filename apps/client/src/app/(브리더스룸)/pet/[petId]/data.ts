import { cache } from "react";
import { PetDto } from "@repo/api-client";
import { getServerRequestHeaders } from "@/lib/server/auth";

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

// 헤더를 캐시하여 같은 렌더링 사이클 내 중복 호출 제거
const getCachedHeaders = cache(async () => {
  return getServerRequestHeaders();
});

// generateMetadata에서 사용 (서버 컴포넌트 전용)
export const fetchPet = cache(async (petId: string): Promise<PetDto | null> => {
  const url = `${BASE_URL}/api/v1/pet/${petId}`;
  const headers = await getCachedHeaders();

  try {
    const res = await fetch(url, { cache: "no-store", headers });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
});

// generateMetadata에서 사용 (서버 컴포넌트 전용)
export const fetchPetThumbnail = cache(
  async (petId: string): Promise<string | null> => {
    const url = `${BASE_URL}/api/v1/pet-image/thumbnail/${petId}`;
    const headers = await getCachedHeaders();

    try {
      const res = await fetch(url, { next: { revalidate: 300 }, headers });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data?.url ?? null;
    } catch {
      return null;
    }
  },
);

export interface FeedingRecord {
  id: number;
  petId: string;
  feedingAt: string;
  foods?: string[];
  amount?: number;
  memo?: string;
}
