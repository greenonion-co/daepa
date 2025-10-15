import { format } from "date-fns";
import { SPECIES_KOREAN_INFO } from "../../constants";
import {
  PetDto,
  PetDtoFather,
  PetDtoMother,
  PetDtoType,
  PetHiddenStatusDtoHiddenStatus,
} from "@repo/api-client";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PetCardProps {
  date: string;
  pets: PetDto[];
  tab: "all" | "hatched" | "egg";
}

const getParentInfo = (parent: PetDtoFather | PetDtoMother | undefined) => {
  if (!parent) return "-";

  if ("hiddenStatus" in parent) {
    return (
      (parent.hiddenStatus === PetHiddenStatusDtoHiddenStatus.SECRET &&
        "(비공개 처리된 펫입니다.)") ||
      (parent.hiddenStatus === PetHiddenStatusDtoHiddenStatus.DELETED && "(삭제된 펫입니다.)")
    );
  }

  return parent.name;
};

const HatchingPetCard = ({ date, pets, tab }: PetCardProps) => {
  return (
    <div className="mb-4">
      <h3 className="mb-2 text-sm font-medium">{format(new Date(date), "yyyy년 MM월 dd일")}</h3>
      <div className="flex flex-wrap gap-2">
        {pets
          .filter((pet) => {
            if (tab === "all") return true;
            if (tab === "hatched") return pet.type === PetDtoType.PET;
            if (tab === "egg") return pet.type === PetDtoType.EGG;
          })
          .map((pet) => {
            const isEgg = pet.type === PetDtoType.EGG;
            const morphs = pet.morphs?.join(" | ");
            const traits = pet.traits?.join(" | ");
            return (
              <Link href={`/pet/${pet.petId}`} key={pet.petId} className="w-full">
                <Card
                  className={cn(
                    "cursor-pointer",
                    pet.type === PetDtoType.PET &&
                      "bg-muted dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800",
                  )}
                >
                  <CardContent>
                    <span className="text-sm text-gray-400">
                      {SPECIES_KOREAN_INFO[pet.species]}
                    </span>
                    {pet.name && (
                      <div className="flex items-center gap-1 font-medium">{pet.name}</div>
                    )}
                    {pet.hatchingDate && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        해칭일: {format(new Date(pet.hatchingDate), "yyyy/MM/dd")}
                      </div>
                    )}

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex flex-col">
                        {isEgg ? <span>알</span> : null}
                        {isEgg && pet.temperature ? <span>온도: {pet.temperature}℃</span> : null}
                        {morphs ? <span>모프: {morphs}</span> : null}
                        {traits ? <span>형질: {traits}</span> : null}
                      </div>
                    </div>

                    {pet.father && (
                      <div className="text-xs text-gray-400">
                        부:
                        {getParentInfo(pet.father)}
                      </div>
                    )}
                    {pet.mother && (
                      <div className="text-xs text-gray-400">모: {getParentInfo(pet.mother)}</div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
      </div>
    </div>
  );
};

export default HatchingPetCard;
