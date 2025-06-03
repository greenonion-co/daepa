import { cn } from "@/lib/utils";

const InfoItem = ({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("py-1", className)}>
    <dt className="flex max-h-[36px] min-w-[80px] shrink-0 items-center text-[16px] text-gray-500">
      {label}
    </dt>
    <dd className="flex-1">{value}</dd>
  </div>
);

export default InfoItem;
