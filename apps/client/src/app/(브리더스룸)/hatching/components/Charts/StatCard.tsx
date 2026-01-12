import { useIsMobile } from "@/hooks/useMobile";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}

const StatCard = ({ label, value, valueClassName }: StatCardProps) => {
  const isMobile = useIsMobile();

  return (
    <div className={cn("rounded-lg p-4 text-center", isMobile && "p-3")}>
      <div className="text-sm font-[500] text-gray-600">{label}</div>
      <div className={cn("text-2xl font-bold", isMobile && "text-[18px]", valueClassName)}>
        {value}
      </div>
    </div>
  );
};

export default StatCard;
