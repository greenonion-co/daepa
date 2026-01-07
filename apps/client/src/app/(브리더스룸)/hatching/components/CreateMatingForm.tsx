import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import {
  pairControllerGetPairList,
  matingControllerCreateMating,
  UnlinkParentDtoRole,
  PetParentDto,
  PetDtoSpecies,
  CreateMatingDtoSpecies,
} from "@repo/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { DateTime } from "luxon";
import CalendarInput from "./CalendarInput";
import ParentLink from "../../pet/components/ParentLink";
import { PetParentDtoWithMessage } from "../../pet/store/parentLink";
import { overlay } from "overlay-kit";
import Dialog from "../../components/Form/Dialog";
import SingleSelect from "../../components/selector/SingleSelect";

const getInitialFormData = () => ({
  father: undefined,
  mother: undefined,
  matingDate: DateTime.now().toFormat("yyyy-MM-dd"),
  species: PetDtoSpecies.CRESTED,
});

interface CreateMatingFormProps {
  onClose: () => void;
}

const CreateMatingForm = ({ onClose }: CreateMatingFormProps) => {
  const queryClient = useQueryClient();
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
      await queryClient.invalidateQueries({ queryKey: [pairControllerGetPairList.name] });
      onClose();
      setFormData(getInitialFormData());
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message ?? "메이팅 추가에 실패했습니다.");
      } else {
        toast.error("메이팅 추가에 실패했습니다.");
      }
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

  const handleSpeciesSelect = (item: string) => {
    if (item === formData.species) return;

    handleNext({
      type: "species",
      value: item,
    });
  };

  return (
    <div className="w-full">
      <div className="grid gap-4">
        {/* 종 선택 */}
        <div className="space-y-1">
          <Label className="text-[14px] font-semibold">종</Label>

          <SingleSelect
            showTitle
            type="species"
            initialItem={formData.species}
            onSelect={handleSpeciesSelect}
          />
        </div>

        {/* 메이팅 날짜 선택 */}
        <div className="space-y-1">
          <Label className="text-[14px] font-semibold">메이팅 날짜</Label>
          <CalendarInput
            placeholder="메이팅 날짜를 선택하세요"
            value={formData.matingDate}
            onSelect={(date) => {
              if (!date) return;
              setFormData((prev) => ({
                ...prev,
                matingDate: DateTime.fromJSDate(date).toFormat("yyyy-MM-dd"),
              }));
            }}
          />
        </div>

        {/* 부모 선택 */}
        <div>
          <Label className="text-[14px] font-semibold">
            부모 개체 선택
            <span className="text-sm text-green-600 dark:text-blue-400">
              * 나의 펫만 선택 가능합니다.
            </span>
          </Label>

          <div className="grid max-w-lg grid-cols-2 gap-2">
            <div className="space-y-1">
              <ParentLink
                allowMyPetOnly={true}
                label="부"
                species={formData.species}
                data={formData.father}
                onSelect={(item) => handleParentSelect(UnlinkParentDtoRole.FATHER, item)}
                onUnlink={handleFatherUnlink}
              />
            </div>
            <div className="space-y-1">
              <ParentLink
                allowMyPetOnly={true}
                label="모"
                species={formData.species}
                data={formData.mother}
                onSelect={(item) => handleParentSelect(UnlinkParentDtoRole.MOTHER, item)}
                onUnlink={handleMotherUnlink}
              />
            </div>
          </div>
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
  );
};

export default CreateMatingForm;
