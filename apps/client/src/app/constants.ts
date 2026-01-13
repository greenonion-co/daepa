/**
 * CDN 캐싱 효율을 위한 이미지 크기 (레티나 2x 대응)
 * - sm: 160px 이하 표시용 (320px 이미지)
 * - lg: 400px 이하 표시용 (800px 이미지)
 */
export const IMAGE_TRANSFORMS = {
  sm: "width=320,height=320,format=webp",
  lg: "width=800,height=800,format=webp",
  xl: "width=1600,height=1600,format=webp",
} as const;
