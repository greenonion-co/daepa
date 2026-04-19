import { z } from "zod";
import type {
  BulkCreatePetRowDto,
  BulkCreatePetRowDtoSpecies,
  BulkCreatePetRowDtoSex,
  BulkCreatePetRowDtoGrowth,
  BulkCreatePetRowDtoAdoptionStatus,
  PetImageItem,
} from "@repo/api-client";

export const MAX_IMAGES_PER_ROW = 3;

/** PetImageItem 그대로 수용하는 zod 객체 (대량 등록은 업로드 메타데이터만 전달) */
const petImageItemSchema = z.object({
  fileName: z.string(),
  url: z.string(),
  mimeType: z.string(),
  size: z.number(),
});

export const SPECIES_VALUES = ["CR", "LE", "FT", "KN", "LC", "GG"] as const;
export const SEX_VALUES = ["M", "F", "N"] as const;
export const GROWTH_VALUES = ["BABY", "JUVENILE", "PRE_ADULT", "ADULT", "DEAD"] as const;
export const ADOPTION_STATUS_VALUES = ["NFS", "ON_SALE", "ON_RESERVATION", "NONE"] as const;

/** 한 행의 스키마 — 필드 단위 검증 */
export const bulkPetRowSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "개체 이름은 필수입니다.")
    .max(30, "개체 이름은 30자 이내여야 합니다."),
  species: z.enum(SPECIES_VALUES, { errorMap: () => ({ message: "종을 선택해주세요." }) }),
  isPublic: z.boolean().optional(),
  hatchingDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다.")
    .optional()
    .or(z.literal("")),
  sex: z.enum(SEX_VALUES).optional(),
  morphs: z.array(z.string()).max(5, "모프는 최대 5개까지 선택 가능합니다.").optional(),
  traits: z.array(z.string()).max(10, "형질은 최대 10개까지 선택 가능합니다.").optional(),
  growth: z.enum(GROWTH_VALUES).optional(),
  weight: z
    .number({ invalid_type_error: "숫자를 입력해주세요." })
    .positive("몸무게는 양수여야 합니다.")
    .optional()
    .nullable(),
  foods: z.array(z.string()).optional(),
  isBreeder: z.boolean().optional(),
  adoptionStatus: z.enum(ADOPTION_STATUS_VALUES).optional(),
  fatherName: z.string().trim().max(30).optional().or(z.literal("")),
  motherName: z.string().trim().max(30).optional().or(z.literal("")),
  images: z
    .array(petImageItemSchema)
    .max(MAX_IMAGES_PER_ROW, `이미지는 최대 ${MAX_IMAGES_PER_ROW}장까지 등록 가능합니다.`)
    .optional(),
});

export type BulkPetRowValue = z.infer<typeof bulkPetRowSchema>;

/** 배치 전체 — 크로스-행 검증 (이름 중복, 자기참조, 동성부모) */
export const bulkPetBatchSchema = z
  .array(bulkPetRowSchema)
  .min(1, "최소 1개 이상의 개체가 필요합니다.")
  .max(200, "최대 200개까지 등록할 수 있습니다.")
  .superRefine((rows, ctx) => {
    // 배치 내 이름 중복
    const nameToIndices = new Map<string, number[]>();
    rows.forEach((r, i) => {
      if (!r.name) return;
      if (!nameToIndices.has(r.name)) nameToIndices.set(r.name, []);
      nameToIndices.get(r.name)!.push(i);
    });
    for (const [, indices] of nameToIndices) {
      if (indices.length > 1) {
        for (const i of indices) {
          ctx.addIssue({
            path: [i, "name"],
            code: z.ZodIssueCode.custom,
            message: "배치 내 중복된 이름입니다.",
          });
        }
      }
    }

    // 자기참조 + 부/모 동일
    rows.forEach((r, i) => {
      if (r.fatherName && r.fatherName === r.name) {
        ctx.addIssue({
          path: [i, "fatherName"],
          code: z.ZodIssueCode.custom,
          message: "자기 자신을 부개체로 지정할 수 없습니다.",
        });
      }
      if (r.motherName && r.motherName === r.name) {
        ctx.addIssue({
          path: [i, "motherName"],
          code: z.ZodIssueCode.custom,
          message: "자기 자신을 모개체로 지정할 수 없습니다.",
        });
      }
      if (r.fatherName && r.motherName && r.fatherName === r.motherName) {
        ctx.addIssue({
          path: [i, "fatherName"],
          code: z.ZodIssueCode.custom,
          message: "부개체와 모개체가 동일합니다.",
        });
      }
    });
  });

/** 서버 전송 직전 DTO로 변환 (빈 문자열 → undefined) */
export function toDto(row: BulkPetRowValue): BulkCreatePetRowDto & { images?: PetImageItem[] } {
  return {
    name: row.name,
    species: row.species as BulkCreatePetRowDtoSpecies,
    sex: row.sex as BulkCreatePetRowDtoSex | undefined,
    growth: row.growth as BulkCreatePetRowDtoGrowth | undefined,
    hatchingDate: row.hatchingDate || undefined,
    isPublic: row.isPublic,
    isBreeder: row.isBreeder,
    morphs: row.morphs?.length ? row.morphs : undefined,
    traits: row.traits?.length ? row.traits : undefined,
    foods: row.foods?.length ? row.foods : undefined,
    weight: row.weight ?? undefined,
    adoptionStatus: row.adoptionStatus as BulkCreatePetRowDtoAdoptionStatus | undefined,
    fatherName: row.fatherName || undefined,
    motherName: row.motherName || undefined,
    images: row.images?.length ? row.images : undefined,
  };
}

export type FieldError = {
  rowIndex: number;
  field: keyof BulkPetRowValue | string;
  message: string;
};

/** zod 이슈 → FieldError 변환 */
export function zodIssuesToFieldErrors(issues: z.ZodIssue[]): FieldError[] {
  return issues
    .map((issue) => {
      const [rowIdx, field] = issue.path;
      if (typeof rowIdx !== "number") return null;
      return {
        rowIndex: rowIdx,
        field: String(field ?? ""),
        message: issue.message,
      };
    })
    .filter((x): x is FieldError => x !== null);
}
