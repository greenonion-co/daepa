import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import QRCode from "qrcode";
import { format, parse } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { AdoptionDtoStatus } from "@repo/api-client";

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
      return <Badge className="bg-gray-500">판매안함</Badge>;
    case AdoptionDtoStatus.ON_SALE:
      return <Badge className="bg-blue-500">판매중</Badge>;
    case AdoptionDtoStatus.ON_RESERVATION:
      return <Badge className="bg-yellow-500">예약중</Badge>;
    case AdoptionDtoStatus.SOLD:
      return <Badge className="bg-green-500">판매완료</Badge>;
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
