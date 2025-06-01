"use client";

import {
  eggControllerDelete,
  eggControllerUpdate,
  EggDto,
  parentControllerCreateParent,
  parentControllerDeleteParent,
  PetParentDto,
} from "@repo/api-client";
import ParentLink from "../pet/components/ParentLink";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit3 } from "lucide-react";
import InfoItem from "../components/Form/InfoItem";
import { FormField } from "../components/Form/FormField";
import { toast } from "sonner";
import { overlay } from "overlay-kit";
import Dialog from "../components/Form/Dialog";
import { EGG_EDIT_STEPS } from "../constants";
import useParentLinkStore from "../pet/store/parentLink";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { formatDateToYYYYMMDD } from "@/lib/utils";

type EggDetailDto = Omit<EggDto, "layingDate"> & {
  layingDate: string;
};
interface EggDetailProps {
  egg: EggDetailDto;
}

const EggDetail = ({ egg }: EggDetailProps) => {
  const router = useRouter();
  const [formData, setFormData] = useState<EggDetailDto>(egg);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const { selectedParent, setSelectedParent } = useParentLinkStore();

  const { mutate: mutateDeleteEgg } = useMutation({
    mutationFn: (eggId: string) => eggControllerDelete(eggId),
    onSuccess: () => {
      router.push("/hatching");

      toast.success("알이 삭제되었습니다.");
    },
    onError: () => {
      toast.error("알 삭제에 실패했습니다.");
    },
  });

  const { mutate: mutateDeleteParent } = useMutation({
    mutationFn: ({ relationId }: { relationId: number }) =>
      parentControllerDeleteParent(relationId),
  });

  const { mutate: mutateRequestParent } = useMutation({
    mutationFn: ({
      parentId,
      role,
      isMyPet,
      message,
    }: {
      parentId: string;
      role: "father" | "mother";
      isMyPet: boolean;
      message: string;
    }) =>
      parentControllerCreateParent(egg.eggId, {
        parentId,
        role,
        isMyPet,
        message,
        childType: "egg",
      }),
    onSuccess: () => {
      toast.success("부모 연동 요청이 완료되었습니다.");
      const role = selectedParent?.sex?.toString() === "M" ? "father" : "mother";
      setFormData((prev) => ({ ...prev, [role]: { ...selectedParent, status: "pending" } }));
      setSelectedParent(null);
    },
    onError: () => {
      toast.error("부모 연동 요청에 실패했습니다.");
      setSelectedParent(null);
    },
  });

  const handleChange = (value: { type; value }) => {
    if (!isEditing) return;
    setFormData((prev) => ({ ...prev, [value.type]: value.value }));
  };

  const handleSave = async () => {
    try {
      const { layingDate, clutch, clutchOrder, desc } = formData;

      if (!egg.eggId) return;

      const updateData = {
        ...(layingDate && { layingDate: formatDateToYYYYMMDD(String(layingDate)) }),
        ...(clutch && { clutch }),
        ...(clutchOrder && { clutchOrder }),
        ...(desc && { desc }),
      };

      await eggControllerUpdate(egg.eggId, updateData);
      setIsEditing(false);
      toast.success("펫 정보 수정이 완료되었습니다.");
    } catch (error) {
      console.error("Failed to update pet:", error);
      toast.error("펫 정보 수정에 실패했습니다.");
    }
  };

  const handleParentSelect = (
    role: "father" | "mother",
    value: PetParentDto & { message: string },
  ) => {
    try {
      setSelectedParent({
        ...value,
        status: "pending",
      });

      // 부모 연동 요청
      mutateRequestParent({
        parentId: value.petId,
        role,
        isMyPet: value.owner.userId === egg.owner.userId,
        message: value.message,
      });
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  };

  const deletePet = async () => {
    try {
      if (!egg.eggId) return;

      mutateDeleteEgg(egg.eggId);
    } catch (error) {
      console.error("Failed to delete egg:", error);
    }
  };

  const handleDelete = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Dialog
        isOpen={isOpen}
        onCloseAction={close}
        onConfirmAction={() => {
          deletePet();
          close();
        }}
        onExit={unmount}
        title="개체 삭제 안내"
        description={`정말로 삭제하시겠습니까? \n 삭제 후 복구할 수 없습니다.`}
      />
    ));
  };

  const handleUnlink = (label: "father" | "mother") => {
    try {
      if (!formData[label]?.relationId) return;
      mutateDeleteParent({ relationId: formData[label]?.relationId });

      toast.success("부모 연동 해제가 완료되었습니다.");
      setFormData((prev) => ({ ...prev, [label]: null }));
    } catch {
      toast.error("부모 연동 해제에 실패했습니다.");
    }
  };

  const onToggle = () => {
    setIsPublic(!isPublic);
  };

  return (
    <div className="mx-auto w-full max-w-[500px] px-4">
      <div className="h-[700px] shrink-0 pt-6">
        <div className="h-full">
          <div className="px-6 pb-20">
            <div className="mb-6">
              <span className="relative text-2xl font-bold after:absolute after:bottom-0 after:left-0 after:-z-10 after:h-[15px] after:w-full after:bg-[#247DFE] after:opacity-40">
                {formData.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="visibility"
                className="data-[state=checked]:bg-blue-600"
                checked={isPublic}
                onCheckedChange={onToggle}
              />
              <Label htmlFor="visibility" className="text-muted-foreground text-sm">
                다른 브리더에게 공개
              </Label>
            </div>

            {/* 혈통 정보 */}
            <div className="pb-4 pt-4">
              <h2 className="mb-3 text-xl font-bold">혈통 정보</h2>

              <div className="grid grid-cols-2 gap-4">
                <ParentLink
                  label="부"
                  data={formData.father}
                  onSelect={(item) => handleParentSelect("father", item)}
                  onUnlink={() => handleUnlink("father")}
                />
                <ParentLink
                  label="모"
                  data={formData.mother}
                  onSelect={(item) => handleParentSelect("mother", item)}
                  onUnlink={() => handleUnlink("mother")}
                />
              </div>
            </div>

            {/* 사육 정보 */}
            <div>
              <div className="mb-2 flex items-center gap-1">
                <h2 className="text-xl font-bold">사육 정보</h2>

                {/* 수정 버튼 */}
                <div className="sticky top-0 z-10 flex justify-end bg-white p-2 dark:bg-[#18181B]">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="h-8 rounded-xl"
                        onClick={() => {
                          setFormData(egg);
                          setIsEditing(false);
                        }}
                      >
                        취소
                      </Button>
                      <Button className="h-8 rounded-xl bg-[#1A56B3]" onClick={handleSave}>
                        저장하기
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setIsEditing(true);
                      }}
                    >
                      <Edit3 />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  {EGG_EDIT_STEPS.map((step) => {
                    return (
                      <InfoItem
                        key={step.field.name}
                        label={step.title}
                        className={step.field.type === "textarea" ? "" : "flex gap-4"}
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
          </div>

          {/* 하단 고정 버튼 영역 */}
          <div className="sticky bottom-0 left-0 right-0 flex justify-between p-4">
            <Button variant="destructive" size="sm" onClick={handleDelete} className="text-white">
              삭제하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EggDetail;
