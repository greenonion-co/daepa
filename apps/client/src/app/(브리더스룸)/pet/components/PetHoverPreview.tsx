"use client";

import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { petImageControllerFindThumbnail } from "@repo/api-client";
import { buildR2TransformedUrl } from "@/lib/utils";
import Image from "next/image";
import { getPetThumbnailQueryKey } from "@/components/common/PetThumbnail";
import { IMAGE_TRANSFORMS } from "@/app/constants";
import { useState } from "react";
import ParentStatusIcon from "../../components/ParentStatusIcon";

interface PetHoverPreviewProps {
  petId: string;
  mousePos: { x: number; y: number };
  name?: string;
  parentStatus?: string;
}

const PREVIEW_SIZE = 200;
const OFFSET = 16;

const PetHoverPreview = ({ petId, mousePos, name, parentStatus }: PetHoverPreviewProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const { data: thumbnail } = useQuery({
    queryKey: getPetThumbnailQueryKey(petId),
    queryFn: () => petImageControllerFindThumbnail(petId),
    select: (response) => response.data.data,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const hasImage = !!thumbnail?.url;
  const imageUrl = hasImage ? buildR2TransformedUrl(thumbnail.url, IMAGE_TRANSFORMS.lg) : null;

  // 이미지도 없고 이름 정보도 없으면 렌더링하지 않음
  if (!hasImage && !name) return null;

  const previewWidth = hasImage ? PREVIEW_SIZE : "auto";

  const estimatedHeight = hasImage ? PREVIEW_SIZE + (name ? 36 : 0) : 36;
  const estimatedWidth = hasImage ? PREVIEW_SIZE : 160;

  const left = Math.min(mousePos.x + OFFSET, window.innerWidth - estimatedWidth - OFFSET);
  const top = Math.min(
    Math.max(mousePos.y - estimatedHeight / 2, OFFSET),
    window.innerHeight - estimatedHeight - OFFSET,
  );

  const isVisible = hasImage ? isLoaded : true;

  return createPortal(
    <div
      className="pointer-events-none fixed z-50 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-zinc-900"
      style={{ left, top, width: previewWidth, opacity: isVisible ? 1 : 0 }}
    >
      {imageUrl && (
        <div className="relative" style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}>
          <Image
            src={imageUrl}
            alt="pet preview"
            fill
            sizes={`${PREVIEW_SIZE}px`}
            className="object-cover"
            onLoad={() => setIsLoaded(true)}
          />
        </div>
      )}
      {name && (
        <div className="flex items-center gap-1 px-2.5 py-2">
          {parentStatus && <ParentStatusIcon status={parentStatus} />}
          <span className="flex items-baseline gap-1">
            <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">
              {name}
            </span>
            {parentStatus === "approved" && (
              <span className="text-[11px] text-[#0F7B6C] dark:text-[#4DAB9A]">인증됨</span>
            )}
            {parentStatus === "pending" && (
              <span className="text-[11px] text-[#D9730D] dark:text-[#FFA344]">대기중</span>
            )}
          </span>
        </div>
      )}
    </div>,
    document.body,
  );
};

export default PetHoverPreview;
