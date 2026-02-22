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
    return <span className={cn(textSizeClass, "text-blue-500", className)}>수컷</span>;
  }

  if (sex === "F") {
    return <span className={cn(textSizeClass, "text-red-500", className)}>암컷</span>;
  }

  // 미구분
  return <span className={cn(textSizeClass, "text-gray-500", className)}>미구분</span>;
}
