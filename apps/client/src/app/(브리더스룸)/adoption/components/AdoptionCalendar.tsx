import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { AdoptionDto, AdoptionDtoStatus } from "@repo/api-client";
import { format } from "date-fns";
import { Info } from "lucide-react";
import { useMemo } from "react";

interface AdoptionCalendarProps {
  data: AdoptionDto[];
  selectedYear: number;
  selectedMonth: number | null;
}

const AdoptionCalendar = ({ data, selectedYear, selectedMonth }: AdoptionCalendarProps) => {
  // 선택된 월의 일별 분양 데이터 생성
  const dailyAdoptionData = useMemo(() => {
    if (selectedMonth === null) return {};

    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const dailyData: Record<
      string,
      { sold: number; onSale: number; onReservation: number; total: number }
    > = {};

    // 해당 월의 모든 날짜에 대해 초기값 설정
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = format(new Date(selectedYear, selectedMonth - 1, day), "yyyyMMdd");
      dailyData[dateKey] = { sold: 0, onSale: 0, onReservation: 0, total: 0 };
    }

    // 실제 데이터로 채우기
    data.forEach((adoption) => {
      if (adoption.adoptionDate) {
        const date = new Date(adoption.adoptionDate);
        if (date.getFullYear() === selectedYear && date.getMonth() === selectedMonth - 1) {
          const dateKey = format(date, "yyyyMMdd");
          if (dailyData[dateKey]) {
            switch (adoption.status) {
              case AdoptionDtoStatus.SOLD:
                dailyData[dateKey].sold++;
                break;
              case AdoptionDtoStatus.ON_SALE:
                dailyData[dateKey].onSale++;
                break;
              case AdoptionDtoStatus.ON_RESERVATION:
                dailyData[dateKey].onReservation++;
                break;
            }
            dailyData[dateKey].total =
              dailyData[dateKey].sold +
              dailyData[dateKey].onSale +
              dailyData[dateKey].onReservation;
          }
        }
      }
    });

    return dailyData;
  }, [data, selectedYear, selectedMonth]);

  if (selectedMonth === null) {
    return (
      <Card className="text-muted-foreground flex h-64 items-center justify-center">
        <CardContent className="flex flex-col items-center justify-center gap-2 text-center text-sm">
          <Info className="h-6 w-6" />
          <span>월을 선택하면 해당 월의 일별 분양 현황을 달력으로 확인할 수 있습니다.</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Calendar
      mode="single"
      month={new Date(selectedYear, selectedMonth - 1)}
      className="rounded-xl border shadow"
      disableNavigation
      classNames={{
        day: "h-20 w-11 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-50",
      }}
      components={{
        DayContent: ({ date }: { date: Date }) => {
          const dateKey = format(date, "yyyyMMdd");
          const count = dailyAdoptionData[dateKey] ?? {
            sold: 0,
            onSale: 0,
            onReservation: 0,
            total: 0,
          };

          return (
            <div className="flex w-full flex-col items-center justify-center gap-1">
              <span className="text-sm font-medium">{date.getDate()}</span>
              <div className="flex flex-col items-center gap-0.5">
                {count.sold > 0 && (
                  <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                    판매 {count.sold}
                  </span>
                )}
                {count.onSale > 0 && (
                  <span className="rounded-xl bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                    판매중 {count.onSale}
                  </span>
                )}
                {count.onReservation > 0 && (
                  <span className="rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-700">
                    예약 {count.onReservation}
                  </span>
                )}
              </div>
            </div>
          );
        },
      }}
    />
  );
};

export default AdoptionCalendar;
