import { format } from "date-fns";
import { EggItem } from "./EggItem";
import { EggDto } from "@repo/api-client";
import { BrEggControllerFindAll200 } from "@repo/api-client";

const EggList = ({
  selectedData,
  tab,
}: {
  selectedData: BrEggControllerFindAll200 | undefined;
  tab: string;
}) => {
  // 필터링 로직을 함수로 분리
  const filterEggs = (eggs: EggDto[]) => {
    return eggs.filter((egg) => (tab === "hatched" ? egg.hatchedPetId : !egg.hatchedPetId));
  };

  const hasAnyEggs = Object.entries(selectedData || {}).some(
    ([_, eggs]) => filterEggs(eggs).length > 0,
  );

  if (!hasAnyEggs) {
    return (
      <div className="flex h-40 items-center justify-center text-gray-500">데이터가 없습니다</div>
    );
  }

  return (
    <>
      {Object.entries(selectedData || {}).map(([date, eggs]) => {
        const filteredEggs = filterEggs(eggs);

        if (filteredEggs.length === 0) return null;

        return (
          <div key={date} className="mb-4">
            <h3 className="mb-2 text-sm font-medium">
              {format(
                new Date(date.slice(0, 4) + "-" + date.slice(4, 6) + "-" + date.slice(6, 8)),
                "yyyy년 MM월 dd일",
              )}
            </h3>
            <div className="space-y-2">
              {filteredEggs.map((egg) => (
                <EggItem key={egg.eggId} node={egg} />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default EggList;
