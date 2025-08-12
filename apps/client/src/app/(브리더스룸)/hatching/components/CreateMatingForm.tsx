import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import {
  brMatingControllerFindAll,
  BrPetControllerFindAllFilterType,
  CommonResponseDto,
  matingControllerCreateMating,
  UnlinkParentDtoRole,
  PetParentDto,
} from "@repo/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { format } from "date-fns";
import CalendarInput from "./CalendarInput";
import ParentLink from "../../pet/components/ParentLink";
import { PetParentDtoWithMessage } from "../../pet/store/parentLink";

interface CreateMatingFormProps {
  onClose: () => void;
}

const CreateMatingForm = ({ onClose }: CreateMatingFormProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<{
    father?: PetParentDto;
    mother?: PetParentDto;
    matingDate: string;
  }>({
    father: undefined,
    mother: undefined,
    matingDate: format(new Date(), "yyyy-MM-dd"),
  });

  const { mutate: createMating } = useMutation({
    mutationFn: matingControllerCreateMating,
    onSuccess: () => {
      toast.success("메이팅이 추가되었습니다.");
      queryClient.invalidateQueries({ queryKey: [brMatingControllerFindAll.name] });
      // 폼 초기화
      setFormData({
        father: undefined,
        mother: undefined,
        matingDate: format(new Date(), "yyyy-MM-dd"),
      });
      onClose();
    },
    onError: (error: AxiosError<CommonResponseDto>) => {
      toast.error(error.response?.data?.message ?? "메이팅 추가에 실패했습니다.");
    },
  });

  const handleSubmit = () => {
    if (!formData.father) {
      toast.error("부 개체를 선택해주세요.");
      return;
    }

    if (!formData.mother) {
      toast.error("모 개체를 선택해주세요.");
      return;
    }

    if (!formData.matingDate) {
      toast.error("메이팅 날짜를 선택해주세요.");
      return;
    }

    createMating({
      matingDate: formData.matingDate,
      fatherId: formData.father.petId,
      motherId: formData.mother.petId,
    });
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

  return (
    <Card className="mt-2 max-w-lg border-2 border-blue-200 bg-blue-50/50 dark:bg-gray-800 dark:text-gray-200">
      <CardHeader>
        <CardTitle className="text-lg">새 메이팅 추가</CardTitle>
        <CardDescription className="text-sm text-blue-700 dark:text-blue-400">
          나의 개체만 선택할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <div className="px-6">
        <div className="grid gap-6">
          {/* 부모 선택 */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">부모 개체 선택</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">부 개체</Label>
                <ParentLink
                  label="부"
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
            <Button onClick={handleSubmit}>메이팅 추가</Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CreateMatingForm;
