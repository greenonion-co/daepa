import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import QRCode from "qrcode";
import { format, parse } from "date-fns";

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

export const formatDateToYYYYMMDD = (dateString: string): number => {
  return Number(dateString.replace(/-/g, ""));
};

export const formatDateToYYYYMMDDString = (
  dateNumber: number,
  formatType: string = "yyyy-MM-dd",
) => {
  const parsedDate = parse(dateNumber.toString(), "yyyyMMdd", new Date());
  const formattedDate = format(parsedDate, formatType);
  return formattedDate;
};
