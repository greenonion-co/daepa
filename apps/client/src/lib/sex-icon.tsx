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
  const { size = "md", className } = options;
  const textSizeClass = TEXT_SIZE_CLASSES[size];

  if (sex === "M") {
    return <div className={cn(textSizeClass, "", className)}>숫</div>;
  }

  if (sex === "F") {
    return <div className={cn(textSizeClass, "", className)}>암</div>;
  }

  // 미구분
  return <div className={cn(textSizeClass, "", className)}>미</div>;
}
