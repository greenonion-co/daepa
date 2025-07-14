import { ChartConfig } from "@/components/ui/chart";
import { Circle, DollarSign, Triangle, Users } from "lucide-react";

export const STATUS_CONFIG = {
  sold: {
    label: "판매 완료",
    color: "bg-green-500",
  },
  onSale: {
    label: "판매 중",
    color: "bg-blue-500",
  },
  onReservation: {
    label: "예약 중",
    color: "bg-yellow-500",
  },
  nfs: {
    label: "판매 안함",
    color: "bg-gray-500",
  },
} as const;

export const STATS_CARDS = [
  {
    key: "totalAdoptions",
    title: "총 분양 수",
    icon: Users,
    bgColor: "bg-white",
    formatter: (value: number) => value.toString(),
  },
  {
    key: "totalRevenue",
    title: "월 매출",
    icon: DollarSign,
    bgColor: "bg-[hsl(48,86%,63%)]",
    formatter: (value: number) => `${value.toLocaleString()}원`,
  },
  {
    key: "soldCount",
    title: "판매 완료",
    icon: Circle,
    bgColor: "bg-[hsl(140,96%,36%)]",
    formatter: (value: number) => value.toString(),
  },
  {
    key: "onSaleCount",
    title: "판매 중",
    icon: Triangle,
    bgColor: "bg-[hsl(221,63%,63%)]",
    formatter: (value: number) => value.toString(),
  },
] as const;

export const chartConfig = {
  sold: {
    label: "판매 완료",
    color: "hsl(142, 76%, 36%)", // 초록색
  },
  onSale: {
    label: "판매 중",
    color: "hsl(221, 83%, 53%)", // 파란색
  },
  onReservation: {
    label: "예약 중",
    color: "hsl(48, 96%, 53%)", // 노란색
  },
  //   nfs: {
  //     label: "판매 안함",
  //     color: "hsl(215, 16%, 47%)", // 회색
  //   },
} satisfies ChartConfig;
