"use client";

import { PetDto, PetDtoSex } from "@repo/api-client";
import { motion } from "framer-motion";
import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { GENDER_KOREAN_INFO, SPECIES_KOREAN_INFO } from "@/app/(브리더스룸)/constants";
import { Expand, Shrink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildR2TransformedUrl, cn, getNumberToDate } from "@/lib/utils";
import { format } from "date-fns";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, EffectFade } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

// Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import { orderBy } from "es-toolkit";

const CardFront = ({ pet, qrCodeDataUrl }: { pet: PetDto; qrCodeDataUrl?: string }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const swiperRef = useRef<SwiperType>(null);

  const imagesInOrder = orderBy(
    pet.photos ?? [],
    [
      (photo) => {
        const fileKey = photo.fileName;
        const index = pet.photoOrder?.indexOf(fileKey);
        return index === -1 ? Infinity : index;
      },
    ],
    ["asc"],
  );

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    setCurrentImageIndex(swiper.realIndex);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl">
      {/* 이미지 컨테이너 */}
      <motion.div
        animate={{
          height: isExpanded ? "100%" : "65%",
        }}
        transition={{ duration: 0.2 }}
        className="relative overflow-hidden"
      >
        {/* Swiper로 구현한 이미지 슬라이더 */}
        <Swiper
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onSlideChange={handleSlideChange}
          modules={[Navigation, Pagination, EffectFade]}
          spaceBetween={0}
          slidesPerView={1}
          loop={imagesInOrder.length > 1}
          speed={300}
          // 터치/드래그 설정
          touchRatio={1}
          touchAngle={45}
          grabCursor={true}
          // 웹에서도 터치 지원
          simulateTouch={true}
          allowTouchMove={true}
          // 키보드 네비게이션
          keyboard={{
            enabled: true,
          }}
          // 마우스휠로 슬라이드 변경 (선택사항)
          mousewheel={{
            forceToAxis: true,
            sensitivity: 1,
            releaseOnEdges: true,
          }}
          className="h-full w-full"
        >
          {imagesInOrder.map((image, index) => (
            <SwiperSlide key={image.fileName} className="relative">
              <div className="relative h-full w-full">
                <Image
                  src={buildR2TransformedUrl(image.url)}
                  alt={`${pet.name} 사진 ${index + 1}`}
                  fill
                  className="object-cover"
                  priority={index === 0} // 첫 번째 이미지만 우선 로딩
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* 커스텀 인디케이터 */}
        {imagesInOrder.length > 1 && (
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {imagesInOrder.map((_, index) => (
              <button
                key={index}
                onClick={() => swiperRef.current?.slideTo(index)}
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-200",
                  currentImageIndex === index
                    ? "scale-110 bg-white"
                    : "bg-white/50 hover:bg-white/70",
                )}
                aria-label={`이미지 ${index + 1}로 이동`}
              />
            ))}
          </div>
        )}

        {/* 좌우 네비게이션 버튼 (데스크톱용) */}
        {imagesInOrder.length > 1 && (
          <>
            <button
              onClick={() => swiperRef.current?.slidePrev()}
              className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/50 md:block"
              aria-label="이전 이미지"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={() => swiperRef.current?.slideNext()}
              className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/50 md:block"
              aria-label="다음 이미지"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* QR 코드 */}
        {qrCodeDataUrl && (
          <div className="absolute right-4 top-4 z-10">
            <Image
              src={qrCodeDataUrl}
              alt="Pet QR Code"
              width={60}
              height={60}
              className="rounded-lg bg-white/90 p-1"
            />
          </div>
        )}
      </motion.div>

      {/* 하단 정보 */}
      <motion.div
        animate={{
          top: isExpanded ? "auto" : "65%",
          bottom: isExpanded ? 0 : "auto",
          color: isExpanded ? "white" : "black",
        }}
        transition={{
          duration: 0.25,
          delay: isExpanded ? 0 : 0.2,
        }}
        className="absolute left-0 right-0 z-10 p-6"
      >
        {isExpanded && (
          <motion.div
            className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/40 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.3,
              delay: isExpanded ? 0.5 : 0,
            }}
          />
        )}

        <div className="mb-4 flex flex-col gap-2">
          {pet.owner && (
            <Badge className="w-fit bg-slate-700 font-bold text-white backdrop-blur-sm">
              {pet.owner?.name || "-"}
            </Badge>
          )}

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{pet.name}</h1>
            </div>

            <div
              className={cn("text-sm font-medium", isExpanded ? "text-gray-200" : "text-gray-600")}
            >
              <div className="flex flex-wrap items-center gap-2">
                {pet.petDetail?.weight && (
                  <span className="inline-flex items-center gap-1">
                    <span className="font-semibold">{pet.petDetail.weight}g</span>
                  </span>
                )}
                {pet.hatchingDate && (
                  <span className="inline-flex items-center gap-1">
                    <span>
                      {format(
                        typeof pet.hatchingDate === "number"
                          ? getNumberToDate(pet.hatchingDate)
                          : new Date(pet.hatchingDate),
                        "yy.MM.dd",
                      )}
                    </span>
                  </span>
                )}
                <span>
                  {SPECIES_KOREAN_INFO[pet.species]} ·{" "}
                  {GENDER_KOREAN_INFO[pet.petDetail?.sex ?? PetDtoSex.NON]}
                </span>
              </div>
            </div>
          </div>

          <div className="scrollbar-hide overflow-x-auto">
            <div className="flex gap-1.5">
              {pet.petDetail?.morphs?.map((morph) => (
                <Badge
                  key={morph}
                  className="whitespace-nowrap bg-yellow-500/90 font-bold text-black backdrop-blur-sm"
                >
                  {morph}
                </Badge>
              ))}
              {pet.petDetail?.traits?.map((trait) => (
                <Badge
                  variant="outline"
                  key={trait}
                  className="whitespace-nowrap border-white/50 bg-white/90 font-bold text-black backdrop-blur-sm"
                >
                  {trait}
                </Badge>
              ))}
            </div>
          </div>

          {pet.desc && (
            <div
              className={cn(
                "mt-2 text-sm leading-relaxed",
                isExpanded ? "line-clamp-2 text-gray-200" : "text-gray-700",
              )}
            >
              {pet.desc}
            </div>
          )}
        </div>
      </motion.div>

      {/* 컨트롤 버튼들 */}
      <div className="absolute bottom-4 right-4 z-20">
        <Button
          size="sm"
          variant="outline"
          className="bg-white/90 backdrop-blur-sm hover:bg-white dark:bg-gray-800/90 dark:text-white dark:hover:bg-gray-700/90"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
        </Button>
      </div>

      {/* 이미지 카운터 (선택사항) */}
      {imagesInOrder.length > 1 && (
        <div className="absolute right-4 top-20 z-10">
          <div className="rounded-full bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm">
            {currentImageIndex + 1} / {imagesInOrder.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default CardFront;
