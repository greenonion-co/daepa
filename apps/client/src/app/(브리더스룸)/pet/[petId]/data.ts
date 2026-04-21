import { cache } from "react";
import { PetDto } from "@repo/api-client";

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

/**
 * 서버 컴포넌트 전용 — 공개 펫 정보 조회 (auth 없이).
 *
 * 서버의 `findPetByPetId`는 @OptionalJwtUser라 auth 없이도 공개 펫은 반환하고,
 * 비공개 펫은 404 응답한다. 소유자 본인의 비공개 펫은 여기서 null이 되어 metadata가
 * 간소화되지만, 비공개 펫은 애초에 공유·SEO 의도가 없어 실질 손해 없음.
 *
 * 이 함수를 auth-free로 유지함으로써 매 SSR마다 `/auth/token`을 호출하던 비용을 제거.
 * 실제 페이지 렌더는 Client(`PetDetailClient`)가 localStorage Bearer로 수행하므로
 * 소유자도 자기 비공개 펫을 정상적으로 볼 수 있다.
 */
export const fetchPet = cache(async (petId: string): Promise<PetDto | null> => {
  const url = `${BASE_URL}/api/v1/pet/${petId}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
});

/** 공개 펫 썸네일 조회 — OG 이미지용. auth 없이 동작. */
export const fetchPetThumbnail = cache(async (petId: string): Promise<string | null> => {
  const url = `${BASE_URL}/api/v1/pet-image/thumbnail/${petId}`;
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.url ?? null;
  } catch {
    return null;
  }
});

export interface FeedingRecord {
  id: number;
  petId: string;
  feedingAt: string;
  foods?: string[];
  amount?: number;
  memo?: string;
}
