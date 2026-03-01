import * as XLSX from "xlsx";
import type {
  BulkCreatePetRowDto,
  BulkCreatePetRowDtoAdoptionStatus,
  BulkCreatePetRowDtoSpecies,
  BulkCreatePetRowDtoSex,
  BulkCreatePetRowDtoGrowth,
} from "@repo/api-client";

/** CSV 한글 컬럼명 → 영문 필드 매핑 */
const COLUMN_MAP: Record<string, string> = {
  종: "species",
  "개체 이름": "name",
  비공개: "isPrivate",
  공개: "isPublic",
  "해칭일(YYYY-MM-DD)": "hatchingDate",
  성별: "sex",
  모프: "morphs",
  형질: "traits",
  크기: "growth",
  "몸무게(g)": "weight",
  몸무게: "weight",
  먹이: "foods",
  분양상태: "adoptionStatus",
  부개체: "fatherName",
  모개체: "motherName",
};

/** 성별 한글 → enum */
const SEX_MAP: Record<string, string> = {
  수컷: "M",
  암컷: "F",
  미구분: "N",
};

/** 성장단계 한글 → enum */
const GROWTH_MAP: Record<string, string> = {
  성체: "ADULT",
  준성체: "PRE_ADULT",
  아성체: "JUVENILE",
  쥬브나일: "JUVENILE",
  베이비: "BABY",
};

/** 종 한글 → enum (풀네임 + 약칭) */
const SPECIES_MAP: Record<string, string> = {
  크레스티드게코: "CR",
  크레: "CR",
  레오파드게코: "LE",
  레게: "LE",
  펫테일게코: "FT",
  펫테일: "FT",
  납테일게코: "KN",
  납테일: "KN",
  리키에너스: "LC",
  리키: "LC",
  가고일게코: "GG",
  가고일: "GG",
};

/** 먹이 한글 → key */
const FOOD_MAP: Record<string, string> = {
  "판게아 인섹트": "pan_insect",
  "판게아 무화과": "pan_fig",
  "판게아 파파야": "pan_papaya",
  "판게아 브리딩포뮬러": "pan_breeding",
  "지렙 인섹트": "grep_insect",
  "지렙 무화과": "grep_fig",
  "레파시 그럽앤후르츠": "rep_grub",
  "레파시 망고슈퍼블렌드": "rep_mango",
  "레파시 바나나크림파이": "rep_banana",
  "바이탈밀 인섹트": "vit_insect",
  "바이탈밀 후르츠": "vit_fruits",
  "바이탈밀 크리켓": "vit_cricket",
  "바이탈밀 츄": "vit_chew",
  "귀뚜라미(생)": "cri_live",
  "귀뚜라미(냉동)": "cri_frozen",
  "귀뚜라미(가루)": "cri_powder",
  "누에(생)": "sil_live",
  "누에(가루)": "sil_powder",
};

/** 분양상태 매핑 */
const ADOPTION_STATUS_MAP: Record<string, string> = {
  NFS: "NFS",
  분양가능: "ON_SALE",
};

function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(current.trim());
        current = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(current.trim());
        if (row.some((cell) => cell !== "")) rows.push(row);
        row = [];
        current = "";
      } else {
        current += ch;
      }
    }
  }

  // 마지막 행
  row.push(current.trim());
  if (row.some((cell) => cell !== "")) rows.push(row);

  return rows;
}

function parseArray(value: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseXlsxToRows(buffer: ArrayBuffer): string[][] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]!]!;
  const rows: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });
  return rows.filter((row) => row.some((cell) => cell !== ""));
}

export function parsePetCsv(input: string | ArrayBuffer): BulkCreatePetRowDto[] {
  const rawRows =
    typeof input === "string"
      ? parseCsvText(input.replace(/^\uFEFF/, ""))
      : parseXlsxToRows(input);

  if (rawRows.length < 2) {
    throw new Error("파일에 데이터가 없습니다.");
  }

  const headers = rawRows[0]!;

  // 헤더 검증: 알려진 컬럼명이 하나도 없으면 에러
  const knownHeaders = headers.filter((h) => h in COLUMN_MAP);
  if (knownHeaders.length === 0) {
    throw new Error(
      "올바른 헤더를 찾을 수 없습니다.\n필수 헤더: 종, 개체 이름",
    );
  }

  // 필수 헤더 체크
  const mappedFields = new Set(knownHeaders.map((h) => COLUMN_MAP[h]));
  const requiredHeaders: [string, string][] = [
    ["name", "개체 이름"],
    ["species", "종"],
  ];
  const missingHeaders = requiredHeaders
    .filter(([field]) => !mappedFields.has(field))
    .map(([, label]) => label);
  if (missingHeaders.length > 0) {
    throw new Error(`필수 헤더가 누락되었습니다: ${missingHeaders.join(", ")}`);
  }
  const errors: string[] = [];
  const results: BulkCreatePetRowDto[] = [];

  for (let i = 1; i < rawRows.length; i++) {
    const cells = rawRows[i]!;
    const rowNum = i + 1;

    // 한글 헤더 → 영문 필드 매핑
    const mapped: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      if (!header) continue;
      const key = COLUMN_MAP[header] ?? header;
      mapped[key] = cells[j] ?? "";
    }

    // 이름이 비어있으면 건너뛰기
    const name = mapped.name?.trim();
    if (!name) {
      continue;
    }

    // 종 매핑
    const speciesRaw = mapped.species?.trim() ?? "";
    const species = SPECIES_MAP[speciesRaw] ?? speciesRaw;
    if (!species) {
      errors.push(`${rowNum}행: 종이 비어있습니다`);
      continue;
    }

    // 날짜 형식 체크
    const hatchingDate = mapped.hatchingDate?.trim() || undefined;
    if (hatchingDate && !/^\d{4}-\d{2}-\d{2}$/.test(hatchingDate)) {
      errors.push(`${rowNum}행: 잘못된 날짜 형식 "${hatchingDate}" (YYYY-MM-DD)`);
      continue;
    }

    // 성별 매핑
    const sexRaw = mapped.sex?.trim() ?? "";
    const sex = SEX_MAP[sexRaw] ?? (sexRaw || undefined);

    // 성장단계 매핑
    const growthRaw = mapped.growth?.trim() ?? "";
    const growth = GROWTH_MAP[growthRaw] ?? (growthRaw || undefined);

    // 공개 여부: "공개" 컬럼이 있으면 직접 사용, "비공개" 컬럼이면 반전
    let isPublic = true;
    if (mapped.isPublic !== undefined) {
      isPublic = mapped.isPublic.trim().toUpperCase() === "TRUE";
    } else if (mapped.isPrivate !== undefined) {
      isPublic = mapped.isPrivate.trim().toUpperCase() !== "TRUE";
    }

    // 몸무게
    const weightStr = mapped.weight?.trim();
    const weight = weightStr ? parseFloat(weightStr) : undefined;
    if (weightStr && (weight === undefined || isNaN(weight))) {
      errors.push(`${rowNum}행: 잘못된 몸무게 값 "${weightStr}"`);
      continue;
    }

    // 분양상태
    const adoptionStatusRaw = mapped.adoptionStatus?.trim() ?? "";
    const adoptionStatus = (ADOPTION_STATUS_MAP[adoptionStatusRaw] ?? (adoptionStatusRaw || undefined)) as BulkCreatePetRowDtoAdoptionStatus | undefined;

    results.push({
      name,
      species: species as BulkCreatePetRowDtoSpecies,
      sex: sex as BulkCreatePetRowDtoSex | undefined,
      growth: growth as BulkCreatePetRowDtoGrowth | undefined,
      hatchingDate,
      isPublic,
      morphs: parseArray(mapped.morphs ?? ""),
      traits: parseArray(mapped.traits ?? ""),
      foods: parseArray(mapped.foods ?? "").map((f) => FOOD_MAP[f] ?? f),
      weight: weight && !isNaN(weight) ? weight : undefined,
      adoptionStatus,
      fatherName: mapped.fatherName?.trim() || undefined,
      motherName: mapped.motherName?.trim() || undefined,
    });
  }

  if (errors.length > 0) {
    const display = errors.slice(0, 10);
    if (errors.length > 10) {
      display.push(`외 ${errors.length - 10}개의 에러`);
    }
    throw new Error(display.join("\n"));
  }

  if (results.length === 0) {
    throw new Error("유효한 데이터가 없습니다.");
  }

  return results;
}
