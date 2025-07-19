import { STATUS_CONFIG } from "../constants";

interface StatusItemProps {
  status: keyof typeof STATUS_CONFIG;
  count: number;
}

const StatusItem = ({ status, count }: StatusItemProps) => {
  const config = STATUS_CONFIG[status];
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{config.label}</span>
      <div className="flex items-center gap-2">
        <div className={`h-3 w-3 rounded-full ${config.color}`}></div>
        <span className="font-medium">{count}</span>
      </div>
    </div>
  );
};

export default StatusItem;
