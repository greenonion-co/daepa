import { FormField } from "@/app/(브리더스룸)/components/Form/FormField";
import { FORM_STEPS, OPTION_STEPS } from "@/app/(브리더스룸)/constants";
import { useFormStore } from "@/app/(브리더스룸)/register/store/form";
import { FieldName } from "@/app/(브리더스룸)/register/types";
import { Button } from "@/components/ui/button";
import { Edit, FlipHorizontal } from "lucide-react";
import { useState } from "react";
import ParentLink from "../../components/ParentLink";
import { petControllerUpdate, PetSummaryDto, UpdatePetDto } from "@repo/api-client";
import { toast } from "sonner";

interface CardBackProps {
  pet: PetSummaryDto;
  setIsFlipped: (isFlipped: boolean) => void;
}

const CardBack = ({ pet, setIsFlipped }: CardBackProps) => {
  const { formData, errors, setFormData } = useFormStore();
  const [isEditing, setIsEditing] = useState(false);
  const visibleFields = [
    ...[...FORM_STEPS].reverse(),
    ...OPTION_STEPS.filter((step) =>
      ["traits", "foods", "birthdate", "weight", "name", "desc"].includes(step.field.name),
    ),
  ];

  const handleChange = (value: { type: FieldName; value: string | string[] }) => {
    if (!isEditing) return;
    setFormData((prev) => ({ ...prev, [value.type]: value.value }));
  };

  const handleSave = async () => {
    try {
      const { petId, ownerId, father, mother, weight, ...restFormData } = formData;

      if (!petId) return;

      const updateData = {
        ...restFormData,
        // fatherId: father?.petId || null,
        // motherId: mother?.petId || null,
        weight: Number(weight),
      };

      await petControllerUpdate(petId, updateData as UpdatePetDto);
      setIsEditing(false);
      toast.success("펫 정보 수정이 완료되었습니다.");
    } catch (error) {
      console.error("Failed to update pet:", error);
      toast.error("펫 정보 수정에 실패했습니다.");
    }
  };

  const handleParentSelect = (label: "father" | "mother", value: PetSummaryDto) => {
    setFormData((prev) => ({ ...prev, [label]: value }));
  };

  return (
    <div className="absolute h-full w-full [-webkit-backface-visibility:hidden] [backface-visibility:hidden] [transform:rotateY(180deg)]">
      <div
        className="h-full overflow-auto rounded-lg border-4 border-gray-300 bg-white shadow-xl dark:bg-[#18181B]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 수정 버튼 */}
        <div className="sticky top-0 z-10 flex justify-end bg-white p-2 dark:bg-[#18181B]">
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFormData(pet);
                  setIsEditing(false);
                }}
              >
                취소
              </Button>
              <Button className="text-white hover:bg-blue-600" onClick={handleSave}>
                저장하기
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditing(true);
              }}
              className="flex items-center gap-1"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="p-4">
          {/* 사육 정보 */}
          <div>
            <h2 className="mb-2 text-xl font-bold">사육 정보</h2>
            <div className="space-y-4">
              <div>
                {visibleFields.map((step) => {
                  return (
                    <InfoItem
                      key={step.field.name}
                      label={step.title}
                      value={
                        <FormField
                          field={step.field}
                          formData={formData}
                          errors={errors}
                          handleChange={handleChange}
                          disabled={!isEditing}
                        />
                      }
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* 혈통 정보 */}
          <div className="pt-4">
            <h2 className="mb-3 text-xl font-bold">혈통 정보</h2>

            <div className="grid grid-cols-2 gap-4">
              <ParentLink
                label="부"
                data={formData.father}
                onSelect={(item) => handleParentSelect("father", item)}
              />
              <ParentLink
                label="모"
                data={formData.mother}
                onSelect={(item) => handleParentSelect("mother", item)}
              />
            </div>
          </div>
        </div>

        {/* 플로팅 버튼 추가 */}
        <div className="fixed bottom-4 right-4">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full bg-white/80 backdrop-blur-sm dark:bg-gray-600/50 dark:text-white dark:hover:bg-gray-800/80"
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(false);
            }}
          >
            <FlipHorizontal className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center gap-4 py-1">
    <dt className="min-w-[80px] shrink-0 text-[16px] text-gray-500">{label}</dt>
    <dd className="flex-1">{value}</dd>
  </div>
);

export default CardBack;
