import AppleIcon from "@/assets/providers/apple.svg";
import GoogleIcon from "@/assets/providers/google.svg";
import KakaoIcon from "@/assets/providers/kakao.svg";
import NaverIcon from "@/assets/providers/naver.png";
import { UserProfileDtoProviderItem } from "@repo/api-client";
import { StaticImageData } from "next/image";

export const providerIconMap: Record<UserProfileDtoProviderItem, StaticImageData> = {
  [UserProfileDtoProviderItem.kakao]: KakaoIcon,
  [UserProfileDtoProviderItem.google]: GoogleIcon,
  [UserProfileDtoProviderItem.naver]: NaverIcon,
  [UserProfileDtoProviderItem.apple]: AppleIcon,
};
