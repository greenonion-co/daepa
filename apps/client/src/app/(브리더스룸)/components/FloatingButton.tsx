import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const FloatingButton = ({ label, onClick }: { label: string; onClick: () => void }) => {
  const { state, isMobile } = useSidebar();

  return (
    <div
      className={cn(
        "z-11 fixed bottom-0 left-0 right-0 bg-white p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] dark:bg-black",
        !isMobile && state === "expanded" && "ml-[255px]",
      )}
    >
      <div className="mx-auto max-w-[640px]">
        <button
          type="submit"
          className="h-12 w-full cursor-pointer rounded-2xl bg-[#247DFE] text-lg font-bold text-white"
          onClick={onClick}
        >
          {label}
        </button>
      </div>
    </div>
  );
};

export default FloatingButton;
