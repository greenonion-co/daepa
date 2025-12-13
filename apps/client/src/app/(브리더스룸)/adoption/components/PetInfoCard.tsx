import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GENDER_KOREAN_INFO, SPECIES_KOREAN_INFO } from "../../constants";
import { PetSummaryAdoptionDtoSex, PetSummaryAdoptionDtoSpecies } from "@repo/api-client";

/**
 * 펫 정보 카드 컴포넌트
 * @remarks
 * - 판매 완료된 펫은 클릭 불가
 */
interface PetInfoCardProps {
  petId: string;
  name?: string;
  species: PetSummaryAdoptionDtoSpecies;
  sex?: PetSummaryAdoptionDtoSex;
  morphs?: string[];
  traits?: string[];
  hatchingDate?: string;
  isSold: boolean;
  onClose?: () => void;
  className?: string;
}

export const PetInfoCard = ({
  petId,
  name,
  species,
  sex,
  morphs,
  traits,
  hatchingDate,
  isSold,
  onClose,
  className,
}: PetInfoCardProps) => {
  return (
    <Link
      href={isSold ? "#" : `/pet/${petId}`}
      onClick={() => !isSold && onClose?.()}
      className={cn(isSold ? "cursor-not-allowed" : "cursor-pointer", className)}
    >
      <Card className="bg-muted mb-4 flex gap-0 border-2 p-4 hover:shadow-md">
        <div className="mb-2 flex items-center gap-2 font-semibold">
          {name}

          <div className="text-muted-foreground text-sm font-normal">
            | {SPECIES_KOREAN_INFO[species] || "미분류"}
          </div>
          {sex && <p className="text-sm font-normal text-blue-500">| {GENDER_KOREAN_INFO[sex]}</p>}
        </div>
        <div className="flex flex-col gap-2 text-sm text-gray-600">
          {morphs && morphs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {morphs.map((morph) => (
                <Badge key={morph}>{morph}</Badge>
              ))}
            </div>
          )}
          {traits && traits.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {traits.map((trait: string) => `#${trait}`).join(" ")}
            </div>
          )}
          {hatchingDate && <p className="text-blue-600">{hatchingDate}</p>}
        </div>
      </Card>
    </Link>
  );
};
