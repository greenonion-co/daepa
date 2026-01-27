import { Mars, Venus } from "lucide-react";
import { cn } from "./utils";

type SexIconSize = "xs" | "sm" | "md" | "lg" | "xl";

interface SexIconOptions {
  size?: SexIconSize;
  className?: string;
}

const SIZE_CLASSES: Record<SexIconSize, string> = {
  xs: "w-3",
  sm: "w-4",
  md: "w-5",
  lg: "w-6",
  xl: "w-8",
};

const TEXT_SIZE_CLASSES: Record<SexIconSize, string> = {
  xs: "text-sm",
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
};

export function getSexIcon(sex: string | undefined | null, options: SexIconOptions = {}) {
  const { size = "md", className } = options;
  const sizeClass = SIZE_CLASSES[size];
  const textSizeClass = TEXT_SIZE_CLASSES[size];

  if (sex === "M") {
    return <Mars className={cn(sizeClass, "stroke-3 text-blue-400", className)} />;
  }

  if (sex === "F") {
    return <Venus className={cn(sizeClass, "stroke-3 text-red-400", className)} />;
  }

  // 미구분
  return (
    <div
      className={cn(
        "grid place-items-center font-bold text-yellow-400",
        sizeClass,
        textSizeClass,
        className,
      )}
    >
      ?
    </div>
  );
}
