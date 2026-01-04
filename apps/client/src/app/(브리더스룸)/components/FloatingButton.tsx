import { cn } from "@/lib/utils";

interface FloatingButtonProps {
  leftButton?: {
    title: string;
    onClick: () => void;
  };
  rightButton: {
    title: string;
    onClick: () => void;
  };
  className?: string;
}

const FloatingButton = ({ leftButton, rightButton, className }: FloatingButtonProps) => {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-10 bg-white p-2 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] dark:bg-black",
        className,
      )}
    >
      <div className="mx-auto flex max-w-[640px] gap-2">
        {leftButton && (
          <button
            type="button"
            className={cn(
              "h-12 flex-1 rounded-xl bg-gray-200 text-lg font-[700] text-gray-700 dark:bg-gray-700 dark:text-gray-200",
            )}
            onClick={leftButton.onClick}
          >
            {leftButton.title}
          </button>
        )}
        {rightButton && (
          <button
            type="button"
            className={cn(
              "h-12 flex-[2] rounded-xl bg-black text-lg font-[700] text-white dark:bg-blue-700",
            )}
            onClick={rightButton.onClick}
          >
            {rightButton.title}
          </button>
        )}
      </div>
    </div>
  );
};

export default FloatingButton;
