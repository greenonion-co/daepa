import { format } from "date-fns";
import { GENDER_KOREAN_INFO, SPECIES_KOREAN_INFO } from "../../constants";
import { PetDto, PetDtoType, PetParentDto } from "@repo/api-client";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PetCardProps {
  date: string;
  pets: PetDto[];
  tab: "all" | "hatched" | "notHatched";
}

const HatchingPetCard = ({ date, pets, tab }: PetCardProps) => {
  return (
    <div className="mb-4">
      <h3 className="mb-2 text-sm font-medium">{format(new Date(date), "yyyy년 MM월 dd일")}</h3>
      <div className="flex flex-wrap gap-2">
        {pets
          .filter((pet) => {
            if (tab === "all") return true;
            if (tab === "hatched") return pet.type === PetDtoType.PET;
            if (tab === "notHatched") return pet.type === PetDtoType.EGG;
          })
          .map((pet) => (
            <Link href={`/pet/${pet.petId}`} key={pet.petId} className="w-full">
              <Card
                className={cn(
                  "cursor-pointer",
                  pet.type === PetDtoType.PET &&
                    "bg-muted dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800",
                )}
              >
                <CardContent>
                  <div className="font-medium">{pet.name}</div>

                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {SPECIES_KOREAN_INFO[pet.species]} • {GENDER_KOREAN_INFO[pet.sex ?? "N"]}
                  </div>
                  {pet.hatchingDate && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      해칭일: {format(new Date(pet.hatchingDate), "yyyy-MM-dd")}
                    </div>
                  )}
                  {pet.father && (
                    <div className="text-xs text-gray-400">
                      {pet.father.isHidden
                        ? "비공개 처리됨"
                        : "부: " + (pet.father as PetParentDto).name}
                    </div>
                  )}
                  {pet.mother && (
                    <div className="text-xs text-gray-400">
                      {pet.mother.isHidden
                        ? "비공개 처리됨"
                        : "모: " + (pet.mother as PetParentDto).name}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
      </div>
    </div>
  );
};

export default HatchingPetCard;
