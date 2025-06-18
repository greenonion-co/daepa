import { PetDto, PetDtoSex } from "@repo/api-client";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import Image from "next/image";
import { GENDER_KOREAN_INFO, SPECIES_KOREAN_INFO } from "@/app/(브리더스룸)/constants";
import { Expand, Shrink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CardFront = ({ pet, qrCodeDataUrl }: { pet: PetDto; qrCodeDataUrl?: string }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dragStart, setDragStart] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const allImages =
    "photos" in pet && pet.photos && Array.isArray(pet.photos)
      ? pet.photos
      : ["/default-pet-image.png", "/default-pet-image_1.png", "/default-pet-image_2.png"];

  const changeImage = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
    } else {
      setCurrentImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
    }
  };

  const weightFixed = useMemo(() => {
    if (!pet.weight) return null;
    const weight = Number(pet.weight);
    return `${Number.isInteger(weight) ? weight : weight.toFixed(1)}g`;
  }, [pet.weight]);

  return (
    <div className="h-full w-full">
      {/* 이미지 컨테이너 */}
      <motion.div
        animate={{
          height: isExpanded ? "100%" : "65%",
        }}
        transition={{ duration: 0.2 }}
        className="absolute inset-x-0 top-0"
      >
        {/* 스와이프 가능한 이미지 컨테이너 */}
        <motion.div
          className="relative h-full w-full"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0}
          onDragStart={(_, info) => setDragStart(info.point.x)}
          onDragEnd={(_, info) => {
            const dragDistance = info.point.x - dragStart;
            const threshold = 50;

            if (Math.abs(dragDistance) > threshold) {
              if (dragDistance > 0) {
                changeImage("prev");
              } else {
                changeImage("next");
              }
            }
          }}
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute h-full w-full"
            >
              <Image
                src={allImages[currentImageIndex] || "/default-pet-image.png"}
                alt={pet.name}
                fill
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>

          {/* 이미지 인디케이터 */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1">
              {allImages.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    currentImageIndex === index ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}

          {/* 왼쪽 상단 태그 */}
          <div className="absolute -left-[45px] top-[15px] z-10 -rotate-[45deg] transform">
            <div
              className={`w-[140px] py-1 text-center ${
                isExpanded
                  ? "bg-green-500/80 text-white backdrop-blur-sm"
                  : "bg-green-500 text-white"
              }`}
            >
              <span className="text-sm font-semibold italic">브리더</span>
            </div>
          </div>

          {qrCodeDataUrl && (
            <Image
              src={qrCodeDataUrl}
              alt="Pet QR Code"
              className="absolute right-0 z-10"
              width={60}
              height={60}
            />
          )}
        </motion.div>
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
            className="absolute inset-0 -z-10 bg-gradient-to-t from-black/60 via-black/30 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.3,
              delay: isExpanded ? 0.5 : 0,
            }}
          />
        )}

        <div className="mb-4 flex flex-col gap-1">
          <Badge className="whitespace-nowrap bg-slate-700 font-bold text-white backdrop-blur-sm">
            {pet.owner.name}
          </Badge>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{pet.name}</h1>
            <div
              className={cn(
                "whitespace-nowrap text-[12px] font-semibold",
                isExpanded && "text-gray-300",
                !isExpanded && "text-gray-600",
              )}
            >
              <div>
                {weightFixed}
                {!!weightFixed && !!pet.birthdate && " / "}
                {pet.birthdate ?? "-"}
              </div>
              {SPECIES_KOREAN_INFO[pet.species]} / {GENDER_KOREAN_INFO[pet.sex ?? PetDtoSex.NON]}
            </div>
          </div>
          <div className="scrollbar-hide overflow-x-auto">
            <div className="flex gap-1">
              {pet.morphs?.map((morph) => (
                <Badge
                  key={morph}
                  className="whitespace-nowrap bg-yellow-500/80 font-bold text-black backdrop-blur-sm"
                >
                  {morph}
                </Badge>
              ))}
              {pet.traits?.map((trait) => (
                <Badge
                  variant="outline"
                  key={trait}
                  className="whitespace-nowrap bg-white font-bold text-black backdrop-blur-sm"
                >
                  {trait}
                </Badge>
              ))}
            </div>
          </div>
          {pet.desc && (
            <div
              className={cn(
                "mt-4 text-sm text-gray-300",
                isExpanded && "line-clamp-1 text-white",
                !isExpanded && "text-gray-800",
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
          className="bg-white/80 backdrop-blur-sm dark:bg-gray-600/50 dark:text-white dark:hover:bg-gray-800/80"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default CardFront;
