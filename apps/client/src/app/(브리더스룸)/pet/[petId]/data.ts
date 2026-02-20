import { cache } from "react";
import { notFound } from "next/navigation";
import {
  PetDto,
  PetImageItem,
  PetAdoptionDto,
  GetParentsByPetIdResponseDtoData,
} from "@repo/api-client";
import { getServerRequestHeaders } from "@/lib/server/auth";

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

// 헤더를 캐시하여 같은 렌더링 사이클 내 중복 호출 제거
const getCachedHeaders = cache(async () => {
  return getServerRequestHeaders();
});

// React cache()로 감싸서 동일 렌더링 사이클 내 요청 중복 제거
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

export const fetchImages = cache(async (petId: string): Promise<PetImageItem[]> => {
  const url = `${BASE_URL}/api/v1/pet-image/${petId}`;
  const headers = await getCachedHeaders();

  try {
    const res = await fetch(url, { cache: "no-store", headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data;
  } catch {
    return [];
  }
});

export const fetchParents = cache(
  async (petId: string): Promise<GetParentsByPetIdResponseDtoData | null> => {
    const url = `${BASE_URL}/api/v1/pet/parents/${petId}`;
    const headers = await getCachedHeaders();

    try {
      const res = await fetch(url, { cache: "no-store", headers });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch {
      return null;
    }
  },
);

export const fetchAdoption = cache(async (petId: string): Promise<PetAdoptionDto | null> => {
  const url = `${BASE_URL}/api/v1/pet-adoption/${petId}`;
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

export const fetchFeedings = cache(async (petId: string): Promise<FeedingRecord[]> => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  const startDate = `${year}-${month}-01`;
  const endDate = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;

  const url = `${BASE_URL}/api/v1/feedings?petId=${petId}&startDate=${startDate}&endDate=${endDate}&itemPerPage=31`;
  const headers = await getCachedHeaders();

  try {
    const res = await fetch(url, { cache: "no-store", headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data ?? [];
  } catch {
    return [];
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

/**
 * 펫 상세 페이지에 필요한 모든 데이터를 병렬로 미리 요청합니다.
 *
 * ## 사용 목적
 * React의 `cache()`와 함께 사용하여 네트워크 요청을 병렬화하고,
 * Suspense 스트리밍을 유지하면서 전체 로딩 시간을 단축합니다.
 *
 * ## 동작 원리
 * 1. `preloadPetData(petId)` 호출 시 모든 fetch 함수가 await 없이 실행됨
 * 2. 각 fetch 함수는 네트워크 요청을 시작하고 Promise를 반환
 * 3. `cache()`가 (함수, 인자) → Promise 매핑을 저장
 * 4. 이후 자식 컴포넌트에서 같은 함수를 같은 인자로 호출하면 캐시된 Promise 반환
 * 5. 이미 완료된 요청은 즉시 반환, 진행 중인 요청은 해당 Promise를 await
 *
 * ## 타임라인 예시
 * ```
 * 0ms     preloadPetData() 호출 → 4개 요청 동시 시작
 * 50ms    adoption 응답 도착 (cache에 저장)
 * 80ms    parents 응답 도착 (cache에 저장)
 * 120ms   images 응답 도착 (cache에 저장)
 * 150ms   pet 응답 도착 → children 렌더링 시작
 *         └─ await fetchImages() → 즉시 반환 (이미 완료됨)
 *         └─ await fetchParents() → 즉시 반환 (이미 완료됨)
 *         └─ await fetchAdoption() → 즉시 반환 (이미 완료됨)
 * ```
 *
 * ## 주의사항
 * - 반드시 `cache()`로 감싼 fetch 함수와 함께 사용해야 함
 * - `cache()` 없이 사용하면 preload된 Promise가 버려지고 중복 요청 발생
 * - 캐시는 해당 서버 렌더링 요청(request) 동안만 유지됨
 *
 * @param petId - 조회할 펫의 ID
 */
export function preloadPetData(petId: string) {
  void fetchPet(petId);
  void fetchImages(petId);
  void fetchParents(petId);
  void fetchAdoption(petId);
  void fetchFeedings(petId);
}

/**
 * 펫 상세 페이지의 공통 데이터 로딩 로직입니다.
 *
 * 1. preloadPetData로 모든 데이터 병렬 요청 시작
 * 2. pet 데이터 await
 * 3. pet이 없으면 notFound() 호출
 *
 * @param petId - 조회할 펫의 ID
 * @returns 펫 데이터 (없으면 notFound로 인해 반환되지 않음)
 */
export async function loadPetDetailPageData(petId: string): Promise<PetDto> {
  preloadPetData(petId);
  const pet = await fetchPet(petId);

  if (!pet) {
    notFound();
  }

  return pet;
}
