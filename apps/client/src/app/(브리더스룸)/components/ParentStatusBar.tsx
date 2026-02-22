const colorMap: Record<string, string> = {
  approved: "bg-green-500",
  pending: "bg-amber-400",
  rejected: "bg-red-400",
  deleted: "bg-red-400",
  cancelled: "bg-gray-400",
};

export default function ParentStatusBar({ status }: { status: string }) {
  const color = colorMap[status];
  if (!color) return null;
  return <span className={`inline-block h-3 w-[3px] shrink-0 rounded-full ${color}`} />;
}
