"use client";

import {
  CreateParentDto,
  eggControllerDelete,
  eggControllerHatched,
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
import { cn, formatDateToYYYYMMDD } from "@/lib/utils";
import FloatingButton from "../components/FloatingButton";
import { AxiosError } from "axios";
import Loading from "@/components/common/Loading";

type EggDetailDto = Omit<EggDto, "layingDate"> & {
  layingDate: string;
};
interface EggDetailProps {
  egg: EggDetailDto;
}

const EggDetail = ({ egg }: EggDetailProps) => {
  const router = useRouter();
  const [formData, setFormData] = useState<EggDetailDto>(egg);
  const [isEditing, setIsEditing] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const { selectedParent, setSelectedParent } = useParentLinkStore();

  const { mutate: mutateHatched, isPending: isHatching } = useMutation({
    mutationFn: (eggId: string) => eggControllerHatched(eggId),
    onSuccess: (response) => {
      if (response?.data?.hatchedPetId) {
        toast.success("해칭 완료");
        router.push(`/pet/${response.data.hatchedPetId}?from=egg`);
      }
    },
    onError: (error: AxiosError<{ message: string }>) => {
      console.error("Failed to hatch egg:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("펫 등록에 실패했습니다.");
      }
    },
  });

  const { mutate: mutateDeleteEgg, isPending: isDeletingEgg } = useMutation({
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
    mutationFn: ({ parentId, role, message }: CreateParentDto) =>
      parentControllerCreateParent(egg.eggId, {
        parentId,
        role,
        message,
        childType: "egg",
      }),
    onSuccess: () => {
      toast.success("부모 연동 요청이 완료되었습니다.");
      const role = selectedParent?.sex?.toString() === "M" ? "father" : "mother";
      setFormData((prev) => ({ ...prev, [role]: selectedParent }));
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
        clutch: Number(clutch),
        clutchOrder: Number(clutchOrder),
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
      const isMyPet = value.owner.userId === egg.owner.userId;
      setSelectedParent({
        ...value,
        isMyPet,
        status: isMyPet ? "approved" : "pending",
      });

      // 부모 연동 요청
      mutateRequestParent({
        parentId: value.petId,
        role,
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

  const handleHatching = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Dialog
        isOpen={isOpen}
        onCloseAction={close}
        onConfirmAction={() => {
          mutateHatched(egg.eggId);
          close();
        }}
        onExit={unmount}
        title="해칭 안내"
        description={`정말로 해칭 완료하시겠습니까? \n 해칭 후 복구할 수 없습니다.`}
      />
    ));
  };

  if (isHatching || isDeletingEgg) return <Loading />;

  return (
    <div className="mx-auto w-full max-w-[500px] px-2">
      <div className="mb-20 h-full shrink-0 pt-6">
        <div>
          {egg.hatchedPetId && (
            <div className="mb-4 flex items-center justify-between rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  해칭이 완료되었습니다
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/30"
                onClick={() => router.push(`/pet/${egg.hatchedPetId}`)}
              >
                펫 상세보기
              </Button>
            </div>
          )}

          <div className="mb-2 flex justify-between">
            <span className="relative text-2xl font-bold after:absolute after:bottom-0 after:left-0 after:-z-10 after:h-[15px] after:w-full after:bg-[#247DFE] after:opacity-40">
              {formData.name}
            </span>

            <Button
              variant="destructive"
              size="sm"
              className="h-8 rounded-xl"
              onClick={handleDelete}
            >
              삭제하기
            </Button>
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
                currentPetOwnerId={egg.owner.userId}
              />
              <ParentLink
                label="모"
                data={formData.mother}
                onSelect={(item) => handleParentSelect("mother", item)}
                onUnlink={() => handleUnlink("mother")}
                currentPetOwnerId={egg.owner.userId}
              />
            </div>
          </div>

          {/* 사육 정보 */}
          <div>
            <div className="mb-2 flex items-center gap-1">
              <h2 className="text-xl font-bold">사육 정보</h2>

              {/* 수정 버튼 */}
              <div className="sticky top-0 z-10 flex justify-end bg-white p-2 dark:bg-[#18181B]">
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
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

        <div
          className={cn(
            "sticky bottom-0 left-0 flex p-4",
            isEditing ? "justify-end" : "justify-between",
          )}
        >
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
            <FloatingButton label="해칭 완료" onClick={handleHatching} />
          )}
        </div>
      </div>
    </div>
  );
};

export default EggDetail;
