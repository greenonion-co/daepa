"use client";

import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { petImageControllerFindThumbnail } from "@repo/api-client";
import { buildR2TransformedUrl } from "@/lib/utils";
import Image from "next/image";
import { getPetThumbnailQueryKey } from "@/components/common/PetThumbnail";
import { IMAGE_TRANSFORMS } from "@/app/constants";

interface PetHoverPreviewProps {
  petId: string;
  mousePos: { x: number; y: number };
}

const PREVIEW_SIZE = 200;
const OFFSET = 16;

const PetHoverPreview = ({ petId, mousePos }: PetHoverPreviewProps) => {
  const { data: thumbnail } = useQuery({
    queryKey: getPetThumbnailQueryKey(petId),
    queryFn: () => petImageControllerFindThumbnail(petId),
    select: (response) => response.data.data,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  if (!thumbnail?.url) return null;

  const imageUrl = buildR2TransformedUrl(thumbnail.url, IMAGE_TRANSFORMS.lg);

  const left = Math.min(mousePos.x + OFFSET, window.innerWidth - PREVIEW_SIZE - OFFSET);
  const top = Math.min(
    Math.max(mousePos.y - PREVIEW_SIZE / 2, OFFSET),
    window.innerHeight - PREVIEW_SIZE - OFFSET,
  );

  return createPortal(
    <div
      className="pointer-events-none fixed z-50 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-zinc-900"
      style={{ left, top, width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
    >
      <Image
        src={imageUrl}
        alt="pet preview"
        fill
        sizes={`${PREVIEW_SIZE}px`}
        className="object-cover"
      />
    </div>,
    document.body,
  );
};

export default PetHoverPreview;
