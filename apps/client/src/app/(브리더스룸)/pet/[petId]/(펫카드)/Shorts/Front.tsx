import { PetDto } from "@repo/api-client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import { GENDER_KOREAN_INFO, SPECIES_KOREAN_INFO } from "@/app/(브리더스룸)/constants";
import { formatDateToYYYYMMDDString } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const CardFront = ({ pet, qrCodeDataUrl }: { pet: PetDto; qrCodeDataUrl?: string }) => {
  const [dragStart, setDragStart] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const allImages = pet.photos || [
    "/default-pet-image.png",
    "/default-pet-image_1.png",
    "/default-pet-image_2.png",
  ];

  const changeImage = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
    } else {
      setCurrentImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
    }
  };

  return (
    <div className="absolute h-full w-full [-webkit-backface-visibility:hidden] [backface-visibility:hidden] [transform:rotateY(0deg)]">
      <div className="relative h-full overflow-hidden rounded-xl border-gray-300 bg-white shadow-xl dark:bg-[#18181B]">
        {" "}
        {/* 이미지 컨테이너 */}
        <motion.div
          animate={{
            height: "100%",
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
              <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 gap-1">
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
            top: "auto",
            bottom: 0,
            color: "white",
          }}
          transition={{
            duration: 0.25,
            delay: 0.2,
          }}
          className="absolute left-0 right-0 z-10 p-6"
        >
          <motion.div
            className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/50 via-40% to-transparent to-100%"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.3,
              delay: 0.5,
            }}
          />

          <div className="mb-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{pet.name}</h1>
              <div className="whitespace-nowrap text-sm text-gray-300">
                <div>
                  {pet.weight &&
                    (() => {
                      const weight = Number(pet.weight);
                      return `${Number.isInteger(weight) ? weight : weight.toFixed(1)}g / `;
                    })()}
                  {pet.birthdate ? formatDateToYYYYMMDDString(pet.birthdate, "yy.MM.dd") : "-"}
                </div>
                {SPECIES_KOREAN_INFO[pet.species]} / {GENDER_KOREAN_INFO[pet.sex]}
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
                    key={trait}
                    className="whitespace-nowrap bg-white font-bold text-black backdrop-blur-sm"
                  >
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>
            {pet.desc && <div className="line-clamp-1 text-sm text-gray-300">{pet.desc}</div>}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CardFront;
