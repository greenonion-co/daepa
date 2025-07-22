import Loading from "@/components/common/Loading";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CommonResponseDto,
  MatingByDateDto,
  matingControllerCreateMating,
  matingControllerFindAll,
} from "@repo/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import MatingItem from "./MatingItem";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useState, useCallback } from "react";
import { AxiosError } from "axios";

const MatingList = () => {
  const queryClient = useQueryClient();
  const [matingDate, setMatingDate] = useState<string | undefined>(undefined);
  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);
  const { data: matings, isPending } = useQuery({
    queryKey: [matingControllerFindAll.name],
    queryFn: matingControllerFindAll,
    select: (data) => data.data,
  });

  // 메이팅 날짜들을 추출하여 Calendar용 날짜 배열 생성
  const matingDates = useCallback((matingDates: MatingByDateDto[]) => {
    if (!matingDates) return [];

    return matingDates.map((mating) => {
      const dateString = mating.matingDate.toString();
      const year = parseInt(dateString.substring(0, 4), 10);
      const month = parseInt(dateString.substring(4, 6), 10);
      const day = parseInt(dateString.substring(6, 8), 10);
      return new Date(year, month - 1, day);
    });
  }, []);

  const { mutate: createMating } = useMutation({
    mutationFn: matingControllerCreateMating,
    onSuccess: () => {
      toast.success("메이팅이 추가되었습니다.");
      queryClient.invalidateQueries({ queryKey: [matingControllerFindAll.name] });
      // 메이팅 생성 후 캘린더 닫기
      setOpenPopoverIndex(null);
      setMatingDate(undefined);
    },
    onError: (error: AxiosError<CommonResponseDto>) => {
      toast.error(error.response?.data?.message ?? "메이팅 추가에 실패했습니다.");
    },
  });

  if (isPending) {
    return <Loading />;
  }

  if (!matings || matings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            메이팅 현황
          </CardTitle>
          <CardDescription>등록된 메이팅이 없습니다.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleAddMatingClick = ({
    fatherId,
    motherId,
  }: {
    fatherId?: string;
    motherId?: string;
  }) => {
    if (!matingDate) {
      toast.error("메이팅 날짜를 선택해주세요.");
      return;
    }

    const matingDateNumber = parseInt(matingDate.replace(/-/g, ""), 10);

    createMating({
      matingDate: matingDateNumber,
      fatherId,
      motherId,
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            메이팅 현황
          </CardTitle>
          <CardDescription>최근 메이팅 정보를 확인하세요</CardDescription>
        </CardHeader>
      </Card>

      <ScrollArea className="h-[700px]">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {matings.map((matingGroup, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 rounded-lg border-2 border-pink-100 px-2 py-4 shadow-md"
            >
              <div>
                <div className="flex flex-1 gap-2">
                  {matingGroup.father && (
                    <div className="flex flex-1 items-center justify-center rounded-md bg-blue-100 p-1 text-blue-800 hover:bg-blue-200">
                      {matingGroup.father.name}
                    </div>
                  )}
                  {matingGroup.mother && (
                    <div className="flex flex-1 items-center justify-center rounded-md bg-pink-100 p-1 text-pink-800 hover:bg-pink-200">
                      {matingGroup.mother.name}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 px-1">
                <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-100 p-2 text-sm font-semibold text-yellow-800 transition-colors hover:bg-yellow-200">
                  <Popover
                    open={openPopoverIndex === index}
                    onOpenChange={(open) => setOpenPopoverIndex(open ? index : null)}
                  >
                    <PopoverTrigger asChild>
                      <button
                        data-field-name="matingDate"
                        className={cn(
                          "flex w-full cursor-pointer items-center justify-center gap-2",
                        )}
                      >
                        메이팅을 추가하려면 날짜를 선택하세요
                        <CalendarIcon className="h-4 w-4 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={matingDate ? new Date(matingDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            // 선택된 날짜가 이미 메이팅이 있는 날짜인지 확인
                            const dateString = format(date, "yyyyMMdd");
                            const matingDateStrings = matingDates(
                              matingGroup?.matingsByDate ?? [],
                            ).map((d) => format(d, "yyyyMMdd"));

                            if (matingDateStrings.includes(dateString)) {
                              toast.error("이미 메이팅이 등록된 날짜입니다.");
                              return;
                            }

                            // 날짜만 처리하도록 수정 (시간대 문제 해결)
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, "0");
                            const day = String(date.getDate()).padStart(2, "0");
                            setMatingDate(`${year}-${month}-${day}`);

                            const trigger = document.querySelector(
                              `button[data-field-name="layingDate"]`,
                            );
                            if (trigger) {
                              (trigger as HTMLButtonElement).click();
                            }
                          }
                        }}
                        modifiers={{
                          hasMating: matingDates(matingGroup?.matingsByDate ?? []),
                        }}
                        modifiersStyles={{
                          hasMating: {
                            backgroundColor: "#fef3c7",
                            color: "#92400e",
                            fontWeight: "bold",
                          },
                        }}
                        initialFocus
                      />

                      <button
                        onClick={() =>
                          handleAddMatingClick({
                            fatherId: matingGroup.father?.petId,
                            motherId: matingGroup.mother?.petId,
                          })
                        }
                        disabled={!matingDate}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-b-lg bg-black p-2 text-sm font-semibold text-white transition-colors hover:bg-black/80"
                      >
                        {matingDate ? format(new Date(matingDate), "yyyy년 MM월 dd일") : ""} 메이팅
                        추가
                      </button>
                    </PopoverContent>
                  </Popover>
                </div>
                {matingGroup.matingsByDate.map((mating) => (
                  <MatingItem
                    key={mating.id}
                    mating={mating}
                    father={matingGroup.father}
                    mother={matingGroup.mother}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MatingList;
