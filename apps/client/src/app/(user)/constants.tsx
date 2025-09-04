import AppleIcon from "@/assets/providers/apple.svg";
import GoogleIcon from "@/assets/providers/google.svg";
import KakaoIcon from "@/assets/providers/kakao.svg";
import NaverIcon from "@/assets/providers/naver.png";
import { StaticImageData } from "next/image";

export enum SOCIAL_PROVIDER {
  KAKAO = "kakao",
  GOOGLE = "google",
  NAVER = "naver",
  APPLE = "apple",
}

export const providerIconMap: Record<SOCIAL_PROVIDER, StaticImageData> = {
  [SOCIAL_PROVIDER.KAKAO]: KakaoIcon,
  [SOCIAL_PROVIDER.GOOGLE]: GoogleIcon,
  [SOCIAL_PROVIDER.NAVER]: NaverIcon,
  [SOCIAL_PROVIDER.APPLE]: AppleIcon,
};
