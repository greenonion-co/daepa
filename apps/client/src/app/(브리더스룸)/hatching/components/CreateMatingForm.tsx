import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import {
  brMatingControllerFindAll,
  BrPetControllerFindAllFilterType,
  matingControllerCreateMating,
  UnlinkParentDtoRole,
  PetParentDto,
  PetDtoSpecies,
  CreateMatingDtoSpecies,
} from "@repo/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { format } from "date-fns";
import CalendarInput from "./CalendarInput";
import ParentLink from "../../pet/components/ParentLink";
import { PetParentDtoWithMessage } from "../../pet/store/parentLink";
import { cn } from "@/lib/utils";
import { SPECIES_KOREAN_INFO } from "../../constants";
import { useSelect } from "../../register/hooks/useSelect";
import { overlay } from "overlay-kit";
import Dialog from "../../components/Form/Dialog";

const getInitialFormData = () => ({
  father: undefined,
  mother: undefined,
  matingDate: format(new Date(), "yyyy-MM-dd"),
  species: PetDtoSpecies.CRESTED,
});

interface CreateMatingFormProps {
  onClose: () => void;
}

const CreateMatingForm = ({ onClose }: CreateMatingFormProps) => {
  const queryClient = useQueryClient();
  const { handleSelect } = useSelect();
  const [formData, setFormData] = useState<{
    species: PetDtoSpecies;
    father?: PetParentDto;
    mother?: PetParentDto;
    matingDate: string;
  }>(() => getInitialFormData());

  const { mutateAsync: createMating, isPending } = useMutation({
    mutationFn: matingControllerCreateMating,
  });

  const validateForm = (): boolean => {
    if (!formData.father?.petId) {
      toast.error("부 개체를 선택해주세요.");
      return false;
    }

    if (!formData.mother?.petId) {
      toast.error("모 개체를 선택해주세요.");
      return false;
    }

    if (formData.father?.petId && formData.father?.petId === formData.mother?.petId) {
      toast.error("부/모 개체는 서로 달라야 합니다.");
      return false;
    }

    if (!formData.matingDate) {
      toast.error("메이팅 날짜를 선택해주세요.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const { species, matingDate, father, mother } = formData;
    try {
      await createMating({
        species: species as CreateMatingDtoSpecies,
        matingDate,
        fatherId: father!.petId,
        motherId: mother!.petId,
      });

      toast.success("메이팅이 추가되었습니다.");
      queryClient.invalidateQueries({ queryKey: [brMatingControllerFindAll.name] });
      setFormData(getInitialFormData());
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message ?? "메이팅 추가에 실패했습니다.");
      } else {
        toast.error("메이팅 추가에 실패했습니다.");
      }
    } finally {
      onClose();
    }
  };

  const handleParentSelect = (role: UnlinkParentDtoRole, item: PetParentDtoWithMessage) => {
    setFormData((prev) => ({ ...prev, [role]: item }));
    toast.success(`${role === UnlinkParentDtoRole.FATHER ? "부" : "모"} 개체가 선택되었습니다.`);
  };

  const handleFatherUnlink = () => {
    setFormData((prev) => ({ ...prev, father: undefined }));
    toast.success("부 개체 선택이 해제되었습니다.");
  };

  const handleMotherUnlink = () => {
    setFormData((prev) => ({ ...prev, mother: undefined }));
    toast.success("모 개체 선택이 해제되었습니다.");
  };

  const handleNext = (value: { type: string; value: string }) => {
    if (formData.species !== value.value) {
      if (formData.father || formData.mother) {
        overlay.open(({ isOpen, close, unmount }) => (
          <Dialog
            title="종 변경 안내"
            description={`종을 변경하시겠습니까? \n 선택된 부모 개체가 있다면 다시 선택해야 합니다.`}
            isOpen={isOpen}
            onCloseAction={close}
            onConfirmAction={() => {
              close();
              setFormData((prev) => ({
                ...prev,
                father: undefined,
                mother: undefined,
                species: value.value as PetDtoSpecies,
              }));
            }}
            onExit={unmount}
          />
        ));
      } else {
        setFormData((prev) => ({
          ...prev,
          species: value.value as PetDtoSpecies,
        }));
      }
    }
  };

  const handleSpeciesSelect = () => {
    handleSelect({
      type: "species",
      value: formData.species,
      handleNext,
    });
  };

  return (
    <Card className="mt-2 w-full border-2 border-blue-200 bg-blue-50/50 dark:bg-gray-800 dark:text-gray-200">
      <CardHeader>
        <CardTitle className="text-lg">새 메이팅 추가</CardTitle>
        <CardDescription className="text-sm text-blue-700 dark:text-blue-400">
          나의 개체만 선택할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <div className="px-6">
        <div className="grid gap-6">
          <div className="space-y-1">
            <Label className="text-base font-semibold">종</Label>

            <div
              className={cn(
                "flex h-9 w-full cursor-pointer items-center border-b-[1.2px] border-b-gray-200 pr-1 text-left text-[16px] text-gray-400 transition-all duration-300 ease-in-out placeholder:text-gray-400 focus:border-b-[1.8px] focus:border-[#1A56B3] focus:outline-none focus:ring-0 dark:text-gray-400",
                `${formData.species && "cursor-pointer text-black"}`,
              )}
              onClick={handleSpeciesSelect}
            >
              {formData.species
                ? (SPECIES_KOREAN_INFO[formData.species] ?? "종을 선택하세요")
                : "종을 선택하세요"}
            </div>
          </div>

          {/* 부모 선택 */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">부모 개체 선택</Label>
            <div className="grid max-w-lg grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">부 개체</Label>
                <ParentLink
                  label="부"
                  species={formData.species}
                  data={formData.father}
                  onSelect={(item) => handleParentSelect(UnlinkParentDtoRole.FATHER, item)}
                  onUnlink={handleFatherUnlink}
                  petListType={BrPetControllerFindAllFilterType.MY}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">모 개체</Label>
                <ParentLink
                  label="모"
                  species={formData.species}
                  data={formData.mother}
                  onSelect={(item) => handleParentSelect(UnlinkParentDtoRole.MOTHER, item)}
                  onUnlink={handleMotherUnlink}
                  petListType={BrPetControllerFindAllFilterType.MY}
                />
              </div>
            </div>
          </div>

          {/* 메이팅 날짜 선택 */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">메이팅 날짜</Label>
            <CalendarInput
              placeholder="메이팅 날짜를 선택하세요"
              value={formData.matingDate}
              onSelect={(date) => {
                if (!date) return;
                setFormData((prev) => ({
                  ...prev,
                  matingDate: format(date, "yyyy-MM-dd"),
                }));
              }}
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button disabled={isPending} onClick={handleSubmit}>
              {isPending ? "추가 중..." : "메이팅 추가"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CreateMatingForm;
