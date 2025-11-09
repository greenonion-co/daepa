import {
  brMatingControllerFindAll,
  LayingByDateDto,
  layingControllerUpdate,
} from "@repo/api-client";
import CalendarSelect from "./CalendarSelect";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAfter, isBefore, parse } from "date-fns";
import { toast } from "sonner";
import { AxiosError } from "axios";
import EggItem from "./EggItem";
import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayingItemProps {
  layingDates: string[];
  layingData: LayingByDateDto;
  matingDate?: string;
  closeSignal?: number;
}
const LayingItem = ({
  layingDates,
  layingData: { layingDate, layings, layingId },
  matingDate,
  closeSignal,
}: LayingItemProps) => {
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);

  const { mutateAsync: updateLayingDate } = useMutation({
    mutationFn: ({ id, newLayingDate }: { id: number; newLayingDate: string }) =>
      layingControllerUpdate(id, { layingDate: newLayingDate }),
  });

  useEffect(() => {
    if (closeSignal !== undefined) {
      setIsOpen(false);
    }
  }, [closeSignal]);

  const getDisabledDates = (currentLayingDate: string) => {
    const toDate = (s: string) => {
      if (/^\d{8}$/.test(s)) return parse(s, "yyyyMMdd", new Date());
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return parse(s, "yyyy-MM-dd", new Date());
      return new Date(s);
    };
    const convertedLayingDates = layingDates.map(toDate);
    const sortedLayingDates = [...convertedLayingDates].sort((a, b) => a.getTime() - b.getTime());
    const currentIndex = sortedLayingDates.findIndex(
      (date) => date.getTime() === toDate(currentLayingDate).getTime(),
    );
    let prevLayingDate: Date | null = null;
    let nextLayingDate: Date | null = null;

    if (currentIndex > 0) {
      prevLayingDate = sortedLayingDates[currentIndex - 1] || null;
    }

    if (currentIndex < sortedLayingDates.length - 1) {
      nextLayingDate = sortedLayingDates[currentIndex + 1] || null;
    }

    return (date: Date) => {
      // 메이팅 날짜 이전은 비활성화
      if (matingDate && isBefore(date, toDate(matingDate))) {
        return true;
      }

      // 이전 산란일이 있는 경우, 이전 산란일 이전 날짜들은 비활성화
      if (prevLayingDate && isBefore(date, prevLayingDate)) {
        return true;
      }

      // 이후 산란일이 있는 경우, 이후 산란일 이후 날짜들은 비활성화
      if (nextLayingDate && isAfter(date, nextLayingDate)) {
        return true;
      }

      // 현재 산란일 자체는 비활성화
      if (date.getTime() === toDate(currentLayingDate).getTime()) {
        return true;
      }

      return false;
    };
  };
  const handleUpdateLayingDate = async (layingId: number, newLayingDate: string) => {
    try {
      await updateLayingDate({
        id: layingId,
        newLayingDate,
      });
      toast.success("산란일 수정에 성공했습니다.");
      queryClient.invalidateQueries({ queryKey: [brMatingControllerFindAll.name] });
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message ?? "산란일 수정에 실패했습니다.");
      } else {
        toast.error("산란일 수정에 실패했습니다.");
      }
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 pt-0 shadow-sm hover:bg-gray-50 hover:shadow-md">
      <div className="flex h-10 items-center justify-between gap-2 px-2">
        <CalendarSelect
          type="edit"
          disabledDates={layingDates}
          triggerText={layingDate}
          confirmButtonText="산란 날짜 추가"
          onConfirm={(newLayingDate) => handleUpdateLayingDate(layingId, newLayingDate)}
          disabled={getDisabledDates(layingDate)}
        />
        <div
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex h-full flex-1 cursor-pointer items-center justify-end"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 text-blue-600 transition-transform duration-300",
              isOpen ? "rotate-180" : "rotate-0",
            )}
          />
        </div>
      </div>

      <div
        className={cn(
          "grid grid-cols-2 gap-1 overflow-hidden pt-0 transition-all duration-300 ease-in-out md:grid-cols-3",
          isOpen ? "max-h-[1000px] p-2 pt-0 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        {layings.map((pet) => (
          <EggItem key={pet.petId} pet={pet} layingDate={layingDate} />
        ))}
      </div>
    </div>
  );
};

export default LayingItem;
