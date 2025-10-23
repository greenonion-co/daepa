import { Dog } from "lucide-react";
import QRCode from "./QR코드";
import Image from "next/image";
import { buildR2TransformedUrl } from "@/lib/utils";
import { orderBy } from "es-toolkit";
import { PetDto } from "@repo/api-client";
import { SPECIES_KOREAN_INFO } from "@/app/(브리더스룸)/constants";
import Link from "next/link";

const Header = ({ pet }: { pet: PetDto }) => {
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

  if (!pet) return null;
  return (
    <div className="flex items-center gap-2 pb-3">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-yellow-200">
        {imagesInOrder[0]?.url ? (
          <Image
            src={buildR2TransformedUrl(imagesInOrder[0]?.url)}
            alt={pet.petId}
            fill
            className="object-cover"
          />
        ) : (
          <Dog className="h-8 w-8 text-gray-500" />
        )}
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          {pet.name ? (
            <div className="text-[16px] font-bold">{pet.name}</div>
          ) : (
            <div className="flex items-center gap-1 text-[16px] font-bold">
              {pet.father && "petId" in pet.father && "name" in pet.father ? (
                <Link href={`/pet/${pet.father?.petId}`} className="text-blue-600 hover:underline">
                  {pet.father?.name}
                </Link>
              ) : (
                "-"
              )}
              x
              {pet.mother && "petId" in pet.mother && "name" in pet.mother ? (
                <Link href={`/pet/${pet.mother?.petId}`} className="text-blue-600 hover:underline">
                  {pet.mother?.name}
                </Link>
              ) : (
                "-"
              )}
            </div>
          )}
          <div className="text-sm text-gray-500">{SPECIES_KOREAN_INFO[pet.species]}</div>
        </div>
        <div className="text-[18px] font-semibold text-gray-800">
          {pet.adoption?.price && `${pet.adoption.price.toLocaleString()}원`}
        </div>
      </div>

      <QRCode petId={pet.petId} />
    </div>
  );
};

export default Header;
