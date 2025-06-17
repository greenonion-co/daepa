import {
  FORM_STEPS,
  GENDER_KOREAN_INFO,
  OPTION_STEPS,
  SPECIES_KOREAN_INFO,
} from "@/app/(브리더스룸)/constants";

import InfoItem from "@/app/(브리더스룸)/components/Form/InfoItem";
import ParentLink from "../../../components/ParentLink";
import { PetDto } from "@repo/api-client";
import { FormStep } from "@/app/(브리더스룸)/register/types";
import { formatDateToYYYYMMDDString } from "@/lib/utils";
interface ExtendedPetDto extends PetDto {
  [key: string]: any;
}
interface CardBackProps {
  pet: ExtendedPetDto;
  setIsFlipped: (isFlipped: boolean) => void;
}

const CardBack = ({ pet, setIsFlipped }: CardBackProps) => {
  const visibleFields = [
    ...[...FORM_STEPS].reverse(),
    ...OPTION_STEPS.filter((step) =>
      ["traits", "foods", "birthdate", "weight", "name", "desc"].includes(step.field.name),
    ),
  ];

  const renderValue = (field: FormStep["field"]) => {
    if (field.name !== "desc" && !pet[field.name]) {
      return <div className="text-sm text-gray-400">-</div>;
    }

    switch (field.type) {
      case "textarea":
        return (
          <textarea
            className={`mt-2 min-h-[160px] w-full rounded-xl bg-gray-100 p-4 text-left text-[16px] focus:outline-none focus:ring-0 dark:bg-gray-600/50 dark:text-white`}
            value={String(pet[field.name] || "")}
            disabled
            style={{ height: "auto" }}
          />
        );
      case "select":
        return (
          <div>
            {field.name === "sex"
              ? (GENDER_KOREAN_INFO[pet[field.name] as string as keyof typeof GENDER_KOREAN_INFO] ??
                "")
              : field.name === "species"
                ? (SPECIES_KOREAN_INFO[
                    pet[field.name] as string as keyof typeof SPECIES_KOREAN_INFO
                  ] ?? "")
                : ((pet[field.name] as string) ?? "")}
          </div>
        );
      case "multipleSelect":
        return (
          <div>
            <div className="flex flex-wrap gap-1">
              {Array.isArray(pet[field.name]) &&
                pet[field.name].length > 0 &&
                pet[field.name].map((item: string) => (
                  <div
                    className="border-1 mb-1 flex items-center gap-2 rounded-full rounded-xl border-[#1A56B3] border-gray-200 bg-gray-100 px-3 py-1 text-[14px] text-[#1A56B3] text-black dark:bg-gray-600/50 dark:text-white"
                    key={item}
                  >
                    <span>{item}</span>
                  </div>
                ))}
            </div>
          </div>
        );
      case "date":
        return <div>{formatDateToYYYYMMDDString(pet[field.name] as number)}</div>;
      default:
        return <div>{pet[field.name]}</div>;
    }
  };

  return (
    <div
      className="absolute h-full w-full overflow-auto rounded-xl border-gray-300 bg-white shadow-xl [-webkit-backface-visibility:hidden] [backface-visibility:hidden] [transform:rotateY(180deg)] dark:bg-[#18181B]"
      onClick={(e) => {
        e.stopPropagation();
        setIsFlipped(false);
      }}
    >
      <div className="px-6 pb-20">
        {/* 혈통 정보 */}
        <div className="pb-4 pt-4">
          <h2 className="mb-3 text-xl font-bold">혈통 정보</h2>

          <div className="grid grid-cols-2 gap-4">
            <ParentLink
              label="부"
              data={pet.father}
              currentPetOwnerId={pet.owner.userId}
              editable={false}
            />
            <ParentLink
              label="모"
              data={pet.mother}
              currentPetOwnerId={pet.owner.userId}
              editable={false}
            />
          </div>
        </div>

        {/* 사육 정보 */}
        <div>
          <div className="mb-2 flex items-center gap-1">
            <h2 className="text-xl font-bold">사육 정보</h2>
          </div>

          <div className="space-y-4">
            <div>
              {visibleFields.map((step) => {
                return (
                  <InfoItem
                    key={step.field.name}
                    label={step.title}
                    className={step.field.type === "textarea" ? "" : "flex gap-4"}
                    value={renderValue(step.field)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardBack;
