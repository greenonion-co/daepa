import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import QRCode from "qrcode";
import { Badge } from "@/components/ui/badge";
import {
  AdoptionDtoStatus,
  UserNotificationDtoDetailJson,
  UserNotificationDtoType,
} from "@repo/api-client";
import { isEqual, isPlainObject, isUndefined, pick, uniq } from "es-toolkit";
import { IMAGE_TRANSFORMS } from "@/app/constants";
import { DateTime } from "luxon";

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

export const getStatusBadge = (status?: string) => {
  switch (status) {
    case AdoptionDtoStatus.NFS:
      return <Badge className="bg-pink-500">분양안함</Badge>;
    case AdoptionDtoStatus.ON_SALE:
      return <Badge className="bg-blue-500">분양가능</Badge>;
    case AdoptionDtoStatus.ON_RESERVATION:
      return <Badge className="bg-yellow-500">예약중</Badge>;
    case "SOLD":
      return <Badge className="bg-green-500">분양완료</Badge>;
    default:
      return <Badge className="bg-gray-200 text-gray-500">미지정</Badge>;
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
  transform: string = IMAGE_TRANSFORMS.sm,
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

export const compressImageFile = (
  file: File,
  maxDimension = 1600,
  quality = 0.82,
): Promise<File> => {
  // GIF는 애니메이션 유지를 위해 압축하지 않음
  if (file.type === "image/gif") return Promise.resolve(file);

  return new Promise((resolve) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // 이미 충분히 작은 이미지는 압축 불필요
      if (
        img.width <= maxDimension &&
        img.height <= maxDimension &&
        file.size <= 500 * 1024
      ) {
        resolve(file);
        return;
      }

      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const targetW = Math.max(1, Math.round(img.width * scale));
      const targetH = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, targetW, targetH);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name, { type: blob.type }));
        },
        "image/webp",
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });
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

/**
 * 배열 필드가 동일한지 비교하는 헬퍼 함수 (순서 무관)
 */
export const areArraysEqual = (arr1?: string[], arr2?: string[]): boolean => {
  if (arr1 === arr2) return true;
  if (!arr1 || !arr2) return arr1 === arr2;
  if (arr1.length !== arr2.length) return false;
  // 순서 무관 비교를 위해 정렬 후 isEqual 사용
  return isEqual([...arr1].sort(), [...arr2].sort());
};

/**
 * 범용적으로 사용 가능한 변경된 필드 추출 함수
 * 원본 데이터와 현재 데이터를 비교하여 변경된 필드만 반환합니다.
 *
 * @template Original - 원본 데이터 타입
 * @template Current - 현재 데이터 타입
 * @template Result - 결과 객체 타입 (일반적으로 UpdateDto 타입)
 *
 * @param original - 원본 데이터
 * @param current - 현재 데이터
 * @param options - 옵션 설정
 * @param options.fields - 비교할 필드 목록 (키 배열)
 * @param options.arrayFields - 배열 필드 목록 (순서 무관 비교, 기본값: [])
 * @param options.customComparers - 커스텀 비교 함수 맵 (필드별 비교 로직 커스터마이징)
 * @param options.convertUndefinedToNull - undefined 값을 null로 변환할지 여부 (기본값: false)
 *
 * @returns 변경된 필드만 포함하는 부분 객체
 *
 * @example
 * ```typescript
 * const changedFields = getChangedFields(
 *   originalPet,
 *   currentFormData,
 *   {
 *     fields: ["name", "species", "weight"],
 *     arrayFields: ["morphs", "traits"],
 *     convertUndefinedToNull: true, // undefined를 null로 변환
 *   }
 * );
 * ```
 */
export function getChangedFields<
  Original extends Record<string, unknown>,
  Current extends Record<string, unknown>,
  Result extends Partial<Record<string, unknown>> = Partial<Current>,
>(
  original: Original,
  current: Current,
  options: {
    fields: ReadonlyArray<keyof Current>;
    arrayFields?: ReadonlyArray<keyof Current>;
    customComparers?: Partial<Record<string, (original: unknown, current: unknown) => boolean>>;
    convertUndefinedToNull?: boolean;
  },
): Result {
  const {
    fields,
    arrayFields = [],
    customComparers = {},
    convertUndefinedToNull = false,
  } = options;
  const allFields = uniq([...fields, ...arrayFields]);

  // 원본과 현재 데이터에서 비교할 필드만 추출
  const allFieldsArray = allFields.map(String);
  const originalSelected = pick(original, allFieldsArray);
  const currentSelected = pick(current, allFieldsArray);
  const changedFields = {} as Record<string, unknown>;

  // 일반 필드 비교
  for (const field of allFields) {
    const fieldStr = String(field);
    const originalValue = originalSelected[fieldStr];
    const currentValue = currentSelected[fieldStr];

    // 커스텀 비교 함수가 있으면 사용
    const customComparer = customComparers[fieldStr];
    if (customComparer) {
      if (!customComparer(originalValue, currentValue)) {
        // 변경이 감지된 경우에만 undefined를 null로 변환
        changedFields[fieldStr] =
          convertUndefinedToNull && isUndefined(currentValue) ? null : currentValue;
      }
      continue;
    }

    // 배열 필드인지 확인
    if (arrayFields.includes(field)) {
      if (
        !areArraysEqual(originalValue as string[] | undefined, currentValue as string[] | undefined)
      ) {
        // 변경이 감지된 경우에만 undefined를 null로 변환
        changedFields[fieldStr] =
          convertUndefinedToNull && isUndefined(currentValue) ? null : currentValue;
      }
      continue;
    }

    // 일반 필드 비교 (es-toolkit의 isEqual 활용)
    if (!isEqual(originalValue, currentValue)) {
      // 변경이 감지된 경우에만 undefined를 null로 변환
      changedFields[fieldStr] =
        convertUndefinedToNull && isUndefined(currentValue) ? null : currentValue;
    }
  }

  return changedFields as Result;
}

// 가격 포맷터
export const formatPrice = (price: number): string => {
  if (price >= 10000) {
    return `${Math.round(price / 10000).toLocaleString()}만원`;
  }
  return `${price.toLocaleString()}원`;
};

// 온도 기반 해칭 기간 계산 (일 단위)
// 파충류(크레스티드 게코) 기준: 온도에 따라 부화 기간이 달라짐
// 25°C 기준: 약 60일
// 1°C 오를 때마다 10일 감소, 1°C 내릴때마다 10일 추가
export const getIncubationDays = (temperature = 25) => {
  const clampedTemp = Math.max(20, Math.min(30, temperature));
  return 60 - (clampedTemp - 25) * 10;
};

/**
 * 유정란의 D-day 텍스트를 계산합니다.
 * @param layingDate - 산란일 (yyyy-MM-dd 형식)
 * @param temperature - 인큐베이션 온도 (기본값: 25)
 * @returns D-day 텍스트 (예: "D-10", "D-Day", "D+5")
 */
export const getEggDDayText = (layingDate: string, temperature = 25): string => {
  const laying = DateTime.fromFormat(layingDate, "yyyy-MM-dd");
  if (!laying.isValid) return "";

  const incubationDays = getIncubationDays(temperature);
  const expectedHatchDate = laying.plus({ days: incubationDays });
  const today = DateTime.now().startOf("day");
  const daysRemaining = Math.floor(expectedHatchDate.diff(today, "days").days);

  if (daysRemaining > 0) return `D-${daysRemaining}`;
  if (daysRemaining < 0) return `D+${Math.abs(daysRemaining)}`;
  return "D-Day";
};
