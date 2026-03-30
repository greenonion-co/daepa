interface EmptyPetCardProps {
  message: string;
  width?: number;
}

export default function EmptyPetCard({ message, width = 160 }: EmptyPetCardProps) {
  return (
    <div
      className="flex shrink-0 flex-col items-center justify-center rounded-xl bg-white p-2 opacity-40 shadow-sm dark:bg-gray-900"
      style={{ width }}
    >
      <span className="text-xs">{message}</span>
    </div>
  );
}
