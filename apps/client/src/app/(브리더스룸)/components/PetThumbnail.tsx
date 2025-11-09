"use client";

import { buildR2TransformedUrl } from "@/lib/utils";
import Image from "next/image";

const PetThumbnail = ({ imageUrl, alt = "" }: { imageUrl?: string; alt?: string }) => {
  return (
    <div className="relative aspect-square w-full cursor-pointer overflow-hidden rounded-2xl bg-gray-100 text-center text-gray-400 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-700">
      {imageUrl ? (
        <Image
          src={buildR2TransformedUrl(imageUrl)}
          alt={alt}
          fill
          className="object-cover transition-opacity"
        />
      ) : (
        <div className="relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-center text-[12px] text-gray-400 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-700">
          준비중
        </div>
      )}
    </div>
  );
};

export default PetThumbnail;
