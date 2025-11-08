import { cn } from "@/lib/utils";

const FloatingButton = ({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 bg-white p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] dark:bg-black">
      <div className="mx-auto max-w-[640px]">
        <button
          type="submit"
          className={cn(
            "h-12 w-full cursor-pointer rounded-2xl bg-[#247DFE] text-lg font-bold text-white",
            disabled && "bg-gray-300 text-white",
          )}
          onClick={onClick}
          disabled={disabled}
        >
          {label}
        </button>
      </div>
    </div>
  );
};

export default FloatingButton;
