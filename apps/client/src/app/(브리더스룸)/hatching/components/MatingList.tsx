import Loading from "@/components/common/Loading";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MatingByDateDto, matingControllerFindAll } from "@repo/api-client";
import { useQuery } from "@tanstack/react-query";
import { Heart, Plus, ChevronUp, ChevronDown } from "lucide-react";
import MatingItem from "./MatingItem";
import { toast } from "sonner";
import { getNumberToDate } from "@/lib/utils";
import { useCallback, useState } from "react";
import Link from "next/link";
import CalendarSelect from "./CalendarSelect";
import { Button } from "@/components/ui/button";
import CreateMatingForm from "./CreateMatingForm";

const MatingList = () => {
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);

  const { data: matings, isPending } = useQuery({
    queryKey: [matingControllerFindAll.name],
    queryFn: matingControllerFindAll,
    select: (data) => data.data,
  });

  // 메이팅 날짜들을 추출하여 Calendar용 날짜 배열 생성
  const matingDates = useCallback((matingDates: MatingByDateDto[]) => {
    if (!matingDates) return [];

    return matingDates.map((mating) => getNumberToDate(mating.matingDate));
  }, []);

  if (isPending) {
    return <Loading />;
  }

  if (!matings || matings.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                메이팅 현황
              </div>
              <Button
                onClick={() => setIsCreateFormOpen(!isCreateFormOpen)}
                className="flex items-center gap-2"
              >
                {isCreateFormOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {isCreateFormOpen ? "폼 닫기" : "새 메이팅 추가"}
              </Button>
            </CardTitle>
            <CardDescription>등록된 메이팅이 없습니다.</CardDescription>
          </CardHeader>
        </Card>

        {isCreateFormOpen && <CreateMatingForm onClose={() => setIsCreateFormOpen(false)} />}
      </div>
    );
  }

  const handleAddMatingClick = ({
    matingDate,
  }: {
    fatherId?: string;
    motherId?: string;
    matingDate: string;
  }) => {
    if (!matingDate) {
      toast.error("메이팅 날짜를 선택해주세요.");
      return;
    }

    // API 호출은 CreateMatingForm에서 처리하므로 여기서는 토스트만 표시
    toast.error("이 기능은 새 메이팅 추가 폼을 사용해주세요.");
  };

  return (
    <div className="space-y-4">
      {/* 헤더 영역 */}
      <Button
        onClick={() => setIsCreateFormOpen(!isCreateFormOpen)}
        className="flex items-center gap-2"
      >
        새 메이팅 추가
        {isCreateFormOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {/* 폴더블 폼 */}
      {isCreateFormOpen && <CreateMatingForm onClose={() => setIsCreateFormOpen(false)} />}

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
                    <Link
                      href={`/pet/${matingGroup.father.petId}`}
                      className="flex flex-1 items-center justify-center rounded-md bg-blue-100 p-1 text-blue-800 hover:bg-blue-200"
                    >
                      {matingGroup.father.name}
                    </Link>
                  )}
                  {matingGroup.mother && (
                    <Link
                      href={`/pet/${matingGroup.mother.petId}`}
                      className="flex flex-1 items-center justify-center rounded-md bg-pink-100 p-1 text-pink-800 hover:bg-pink-200"
                    >
                      {matingGroup.mother.name}
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 px-1">
                <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-100 p-2 text-sm font-semibold text-yellow-800 transition-colors hover:bg-yellow-200">
                  <CalendarSelect
                    triggerText="메이팅을 추가하려면 날짜를 선택하세요"
                    disabledDates={matingDates(matingGroup?.matingsByDate ?? [])}
                    onConfirm={(matingDate) =>
                      handleAddMatingClick({
                        fatherId: matingGroup.father?.petId,
                        motherId: matingGroup.mother?.petId,
                        matingDate,
                      })
                    }
                  />
                </div>
                {matingGroup.matingsByDate.map((mating) => (
                  <MatingItem
                    key={mating.id}
                    mating={mating}
                    father={matingGroup.father}
                    mother={matingGroup.mother}
                    matingDates={matingDates(matingGroup?.matingsByDate ?? [])}
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
