import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { useMemo, useState } from "react";
import {
  CreateParentDtoRole,
  eggControllerCreate,
  LayingByDateDto,
  matingControllerFindAll,
  PetDtoSpecies,
  PetSummaryDto,
} from "@repo/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SPECIES_KOREAN_INFO } from "../../constants";
import CalendarInput from "./CalendarInput";

interface CreateLayingModalProps {
  isOpen: boolean;
  onClose: () => void;
  matingId: number;
  father?: PetSummaryDto;
  mother?: PetSummaryDto;
  layingData?: LayingByDateDto[];
}

const CreateLayingModal = ({
  isOpen,
  onClose,
  matingId,
  father,
  mother,
  layingData,
}: CreateLayingModalProps) => {
  const queryClient = useQueryClient();
  const lastLayingDate = useMemo(
    () => layingData?.[layingData.length - 1]?.layingDate,
    [layingData],
  );

  const { mutate: createLaying } = useMutation({
    mutationFn: eggControllerCreate,
    onSuccess: () => {
      toast.success("산란이 추가되었습니다.");
      queryClient.invalidateQueries({ queryKey: [matingControllerFindAll.name] });
    },
    onError: () => {
      toast.error("산란 추가에 실패했습니다.");
    },
  });

  const defaultLayingDate = useMemo(() => {
    return lastLayingDate
      ? new Date(
          new Date(
            lastLayingDate.toString().replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
          ).getTime() +
            24 * 60 * 60 * 1000,
        ).toISOString()
      : new Date().toISOString();
  }, [lastLayingDate]);

  const [formData, setFormData] = useState<{
    species: PetDtoSpecies;
    layingDate: string;
    clutchCount: string;
    temperature: string;
    clutch: string;
  }>({
    species: PetDtoSpecies.CRESTED,
    layingDate: defaultLayingDate,
    clutchCount: "2",
    temperature: "25",
    clutch: layingData?.length ? (layingData.length + 1).toString() : "1",
  });

  const handleSubmit = () => {
    if (!formData.species) {
      toast.error("종은 필수 입력 항목입니다.");
      return;
    }

    if (!formData.layingDate) {
      toast.error("산란일은 필수 입력 항목입니다.");
      return;
    }

    if (!formData.clutchCount) {
      toast.error("산란 수는 필수 입력 항목입니다.");
      return;
    }

    // 차수 유효성 검사
    const currentClutch = parseInt(formData.clutch, 10);
    const minClutch = (layingData?.length || 0) + 1;
    if (currentClutch <= minClutch - 1) {
      toast.error(`이전 차수 ${minClutch - 1}보다 커야 합니다.`);
      return;
    }

    const layingDate = parseInt(formData.layingDate.replace(/-/g, ""), 10);

    createLaying({
      matingId,
      layingDate,
      temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
      species: formData.species,
      clutchCount: parseInt(formData.clutchCount, 10),
      clutch: formData.clutch ? parseInt(formData.clutch, 10) : undefined,
      father: father
        ? {
            parentId: father.petId,
            role: CreateParentDtoRole.FATHER,
          }
        : undefined,
      mother: mother
        ? {
            parentId: mother.petId,
            role: CreateParentDtoRole.MOTHER,
          }
        : undefined,
    });

    onClose();
  };

  // 날짜 제한 함수
  const isDateDisabled = (date: Date) => {
    if (!lastLayingDate) return false;

    const selectedDate = parseInt(format(date, "yyyyMMdd"), 10);
    return selectedDate <= lastLayingDate;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>산란 추가</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="species">종</Label>
            <Select
              disabled
              value={formData.species}
              onValueChange={(value: PetDtoSpecies) =>
                setFormData((prev) => ({ ...prev, species: value }))
              }
            >
              <SelectTrigger className="col-span-3 w-full text-[16px]">
                <SelectValue placeholder="종을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(PetDtoSpecies).map((species) => (
                  <SelectItem key={species} value={species} className="text-[16px]">
                    {SPECIES_KOREAN_INFO[species]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="layingDate">산란일</Label>
            <div className="col-span-3">
              <CalendarInput
                placeholder="산란일을 선택하세요"
                value={formData.layingDate}
                onSelect={(date) => {
                  if (!date) return;
                  setFormData((prev) => ({
                    ...prev,
                    layingDate: format(date, "yyyy-MM-dd"),
                  }));

                  const trigger = document.querySelector(`button[data-field-name="layingDate"]`);
                  if (trigger) {
                    (trigger as HTMLButtonElement).click();
                  }
                }}
                disabled={isDateDisabled}
              />

              {lastLayingDate && (
                <div className="mt-1 text-sm">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Info className="h-4 w-4" /> 이전 산란일 이후 날짜만 선택 가능합니다.
                  </div>
                  <div className="font-semibold text-blue-500">
                    마지막 산란일:{" "}
                    {format(
                      new Date(
                        lastLayingDate.toString().replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
                      ),
                      "yyyy년 MM월 dd일",
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clutch">차수</Label>
            <div className="col-span-3 flex flex-col gap-1">
              <Input
                id="clutch"
                type="number"
                min={(layingData?.length || 0) + 2}
                placeholder="차수를 입력하세요"
                value={formData.clutch}
                onChange={(e) => setFormData((prev) => ({ ...prev, clutch: e.target.value }))}
              />
              <div className="col-span-3">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Info className="h-4 w-4" /> 이전 차수 {layingData?.length}보다 커야 합니다.
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clutchCount">알 개수</Label>
            <Input
              id="clutchCount"
              type="number"
              min="1"
              placeholder="알 개수를 입력하세요"
              value={formData.clutchCount}
              onChange={(e) => setFormData((prev) => ({ ...prev, clutchCount: e.target.value }))}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="temperature">온도</Label>
            <Input
              id="temperature"
              type="number"
              step="0.1"
              placeholder="온도를 입력하세요"
              value={formData.temperature}
              onChange={(e) => setFormData((prev) => ({ ...prev, temperature: e.target.value }))}
              className="col-span-3"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit}>추가</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLayingModal;
