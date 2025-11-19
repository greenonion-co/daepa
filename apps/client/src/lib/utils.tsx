import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import QRCode from "qrcode";
import { format, parse } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  AdoptionDtoStatus,
  UserNotificationDtoDetailJson,
  UserNotificationDtoType,
} from "@repo/api-client";
import { isPlainObject } from "es-toolkit";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear().toString().slice(2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}/${month}/${day}`;
};

export const generateQRCode = async (url: string) => {
  try {
    const qrCode = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000", // QR 코드 색상
        light: "#FFFFFF", // 배경 색상
      },
      errorCorrectionLevel: "H", // 높은 오류 수정 레벨
    });

    return qrCode;
  } catch (err) {
    console.error("QR 코드 생성 실패:", err);
    throw err;
  }
};

export const formatDateToYYYYMMDDString = (
  dateNumber: number,
  formatType: string = "yyyy-MM-dd",
): string => {
  const parsedDate = parse(dateNumber.toString(), "yyyyMMdd", new Date());
  const formattedDate = format(parsedDate, formatType);
  return formattedDate;
};

export const getStatusBadge = (status?: AdoptionDtoStatus) => {
  switch (status) {
    case AdoptionDtoStatus.NFS:
      return <Badge className="bg-pink-500">분양안함</Badge>;
    case AdoptionDtoStatus.ON_SALE:
      return <Badge className="bg-blue-500">분양중</Badge>;
    case AdoptionDtoStatus.ON_RESERVATION:
      return <Badge className="bg-yellow-500">예약중</Badge>;
    case AdoptionDtoStatus.SOLD:
      return <Badge className="bg-green-500">분양완료</Badge>;
    default:
      return <Badge variant="outline">미정</Badge>;
  }
};

export const getNumberToDate = (dateNumber: number) => {
  const dateString = dateNumber.toString();
  const year = parseInt(dateString.substring(0, 4), 10);
  const month = parseInt(dateString.substring(4, 6), 10);
  const day = parseInt(dateString.substring(6, 8), 10);
  return new Date(year, month - 1, day);
};

const CLOUDFLARE_R2_URL_BASE = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_IMAGE_BASE_URL;
export const buildR2TransformedUrl = (
  raw: string | undefined,
  transform: string = "width=460,height=700,format=webp",
) => {
  if (!raw) return "";

  try {
    const url = new URL(raw);
    const { origin, pathname } = url;
    // 다른 호스트면 변환 없이 원본 사용 (next.config.ts에 허용된 경우만 렌더)
    if (origin !== CLOUDFLARE_R2_URL_BASE) return raw;

    return `${CLOUDFLARE_R2_URL_BASE}/cdn-cgi/image/${transform}${pathname}`;
  } catch {
    return raw;
  }
};

export const resizeImageFile = (file: File, maxWidth = 1280, quality = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const targetW = Math.max(1, Math.floor(img.width * scale));
        const targetH = Math.max(1, Math.floor(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(reader.result as string);
      img.src = String(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const castDetailJson = <T extends UserNotificationDtoDetailJson>(
  type: UserNotificationDtoType | undefined,
  detailJson: UserNotificationDtoDetailJson | undefined | null,
): T | undefined | null => {
  if (!type || !detailJson || !isPlainObject(detailJson)) {
    return null;
  }

  return detailJson as T;
};
