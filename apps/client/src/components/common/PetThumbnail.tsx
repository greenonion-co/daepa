"use client";

import { buildR2TransformedUrl } from "@/lib/utils";
import { petImageControllerFindThumbnail } from "@repo/api-client";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Loading from "./Loading";
import { IMAGE_TRANSFORMS } from "@/app/constants";
import { SmilePlus } from "lucide-react";

/** maxSize 기준으로 적절한 transform 선택 */
const getTransform = (maxSize: number) => {
  return maxSize <= 160 ? IMAGE_TRANSFORMS.sm : IMAGE_TRANSFORMS.lg;
};

/** 썸네일 캐시 무효화를 위한 queryKey */
export const getPetThumbnailQueryKey = (petId: string) => [
  petImageControllerFindThumbnail.name,
  petId,
];

interface PetThumbnailProps {
  petId?: string;
  /**
   * 이 컴포넌트가 표시될 최대 크기 (px)
   * - CDN 캐싱을 위한 이미지 크기 선택에 사용됨 (sm: ~160px, lg: ~400px)
   * - 실제 렌더링 크기는 부모 요소 또는 className으로 결정
   * @default 160
   */
  maxSize: number;
  alt?: string;
  /** 추가 스타일 클래스 (크기 조절 가능) */
  className?: string;
  /** 원형으로 표시 @default false */
  rounded?: boolean;
  /** 쿼리 비활성화 */
  enabled?: boolean;
  /** 이미지 채우기 방식 @default "contain" */
  objectFit?: "contain" | "cover";
}

/**
 * 펫 썸네일 컴포넌트
 *
 * CDN 캐싱 효율을 위해 2단계 이미지 크기(sm/lg)를 사용합니다.
 * maxSize를 기준으로 적절한 크기가 자동 선택됩니다.
 *
 * - 160px 이하: sm (320px 이미지, 레티나 2x)
 * - 160px 초과: lg (800px 이미지, 레티나 2x)
 *
 * 실제 렌더링 크기는 부모 요소 크기 또는 className으로 조절합니다.
 * 기본적으로 정사각형(aspect-square)으로 부모 너비에 맞춰집니다.
 *
 * @example
 * // 기본 사용 (sm 이미지)
 * <div className="w-[72px]">
 *   <PetThumbnail petId="abc123" maxSize={72} />
 * </div>
 *
 * @example
 * // 큰 이미지 사용 (lg 이미지)
 * <PetThumbnail petId="abc123" maxSize={200} className="w-40 h-40" />
 *
 * @example
 * // 원형 썸네일
 * <PetThumbnail petId="abc123" maxSize={72} rounded className="w-16" />
 *
 * @example
 * // 이미지 변경 시 캐시 무효화
 * import { getPetThumbnailQueryKey } from "@/components/common/PetThumbnail";
 * queryClient.invalidateQueries({ queryKey: getPetThumbnailQueryKey(petId) });
 */
const PetThumbnail = ({
  petId,
  maxSize,
  alt = "pet_thumbnail",
  className = "",
  rounded = false,
  enabled = true,
  objectFit = "contain",
}: PetThumbnailProps) => {
  const { data: thumbnail, isLoading } = useQuery({
    queryKey: getPetThumbnailQueryKey(petId ?? ""),
    queryFn: () => petImageControllerFindThumbnail(petId ?? ""),
    select: (response) => response.data.data,
    enabled: !!petId && enabled,
    // 이미지 변경 전까지 캐시 영구 유지
    // 변경 시 queryClient.invalidateQueries로 수동 무효화
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const transform = getTransform(maxSize);
  const imageUrl = thumbnail?.url ? buildR2TransformedUrl(thumbnail.url, transform) : null;

  return (
    <div
      className={`relative aspect-square w-full overflow-hidden bg-gray-100 dark:bg-transparent ${rounded ? "rounded-full" : "rounded-2xl"} ${className}`}
    >
      {isLoading ? (
        <Loading />
      ) : imageUrl ? (
        <>
          <Image
            src={imageUrl}
            alt={alt}
            fill
            sizes={`${maxSize}px`}
            className={objectFit === "cover" ? "object-cover" : "object-contain"}
          />
          {/* [SAMPLE_WATERMARK] 베타테스트용 워터마크 - 출시 시 삭제 */}
          <span
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center select-none"
            aria-hidden="true"
          >
            <span
              className={`rounded-sm border-2 border-white font-bold tracking-widest text-white opacity-80 ${maxSize > 160 ? "px-3 py-1 text-3xl" : "px-2 py-0.5 text-[0.6rem]"}`}
              style={{ transform: "rotate(-30deg)", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
            >
              SAMPLE
            </span>
          </span>
          {/* [/SAMPLE_WATERMARK] */}
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center opacity-30">
          <SmilePlus className="h-1/3 w-1/3" aria-hidden="true" />
          <span className="sr-only">{alt}</span>
        </div>
      )}
    </div>
  );
};

export default PetThumbnail;
