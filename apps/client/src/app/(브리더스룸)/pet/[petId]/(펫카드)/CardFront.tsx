import { PetDto } from "@repo/api-client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import { GENDER_KOREAN_INFO, SPECIES_KOREAN_INFO } from "@/app/(브리더스룸)/constants";
import { formatDate } from "@/lib/utils";
import { Expand, Shrink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CardFront = ({ pet }: { pet: PetDto }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dragStart, setDragStart] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const allImages = pet.photos || [];

  const changeImage = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
    } else {
      setCurrentImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
    }
  };

  return (
    <div className="absolute h-full w-full [-webkit-backface-visibility:hidden] [backface-visibility:hidden] [transform:rotateY(0deg)]">
      <div className="relative h-full overflow-hidden rounded-lg border-4 border-gray-300 bg-white shadow-xl dark:bg-[#18181B]">
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
            <div className="absolute -left-[45px] top-[15px] z-10 rotate-[-45deg] transform">
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

          <div className="mb-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h1 className={`shrink-0 text-3xl font-bold ${!isExpanded && "dark:text-white"}`}>
                {pet.name}
              </h1>
              <div className="scrollbar-hide overflow-x-auto">
                <div className="flex gap-1">
                  {pet.morphs?.map((morph) => (
                    <Badge
                      key={morph}
                      className={`whitespace-nowrap bg-yellow-500/80 font-bold text-black ${
                        isExpanded ? "backdrop-blur-sm" : ""
                      }`}
                    >
                      {morph}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <p className={isExpanded ? "text-gray-300" : "text-gray-500 dark:text-gray-400"}>
                종
              </p>
              <div>{SPECIES_KOREAN_INFO[pet.species]}</div>
            </div>
            <div>
              <p className={isExpanded ? "text-gray-300" : "text-gray-500 dark:text-gray-400"}>
                성별
              </p>
              <div>{GENDER_KOREAN_INFO[pet.sex as keyof typeof GENDER_KOREAN_INFO]}</div>
            </div>
            <div>
              <p className={isExpanded ? "text-gray-300" : "text-gray-500 dark:text-gray-400"}>
                무게
              </p>
              <div>{`${pet.weight}g`}</div>
            </div>
            <div>
              <p className={isExpanded ? "text-gray-300" : "text-gray-500 dark:text-gray-400"}>
                생년월일
              </p>
              <div>{pet.birthdate ? formatDate(pet.birthdate || "") : "-"}</div>
            </div>
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
    </div>
  );
};

export default CardFront;
