import { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

const ChartCard = ({ title, children, footer }: ChartCardProps) => {
  return (
    <div className="rounded-2xl border-[1.5px] border-gray-200/50 bg-gray-50 p-4 shadow-lg dark:border-gray-700/50 dark:bg-gray-800">
      <span className="font-[600] dark:text-gray-100">{title}</span>
      {children}
      {footer}
    </div>
  );
};

export default ChartCard;
