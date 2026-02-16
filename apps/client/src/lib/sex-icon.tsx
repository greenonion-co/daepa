import { cn } from "./utils";

type SexIconSize = "xs" | "sm" | "md" | "lg" | "xl";

interface SexIconOptions {
  size?: SexIconSize;
  className?: string;
}

const TEXT_SIZE_CLASSES: Record<SexIconSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

export function getSexIcon(sex: string | undefined | null, options: SexIconOptions = {}) {
  if (!sex) return null;

  const { size = "md", className } = options;
  const textSizeClass = TEXT_SIZE_CLASSES[size];

  if (sex === "M") {
    return (
      <div
        className={cn(
          textSizeClass,
          "grid place-items-center rounded-md bg-blue-300 px-1.5 py-0.5 text-[10px] font-semibold shadow-sm",
          className,
        )}
      >
        수컷
      </div>
    );
  }

  if (sex === "F") {
    return (
      <div
        className={cn(
          textSizeClass,
          "grid place-items-center rounded-md bg-red-300 px-1.5 py-0.5 text-[10px] font-semibold shadow-sm",
          className,
        )}
      >
        암컷
      </div>
    );
  }

  // 미구분
  return (
    <div
      className={cn(
        textSizeClass,
        "grid place-items-center rounded-md bg-gray-300 px-1.5 py-0.5 text-[10px] font-semibold shadow-sm",
        className,
      )}
    >
      미구분
    </div>
  );
}
