import * as XLSX from "xlsx";
import { PetDto, PetParentDto } from "@repo/api-client";
import { GROWTH_KOREAN_INFO } from "../../constants";
import { DateTime } from "luxon";

export type ExportFieldKey =
  | "name"
  | "sex"
  | "morphs"
  | "traits"
  | "growth"
  | "weight"
  | "hatchingDate"
  | "parents"
  | "link";

const SEX_LABEL: Record<string, string> = {
  M: "수컷",
  F: "암컷",
  N: "미구분",
};

export const EXPORT_FIELDS: { key: ExportFieldKey; label: string; defaultChecked?: boolean }[] = [
  { key: "name", label: "이름" },
  { key: "hatchingDate", label: "해칭일" },
  { key: "sex", label: "성별" },
  { key: "morphs", label: "모프" },
  { key: "traits", label: "형질" },
  { key: "parents", label: "부모정보" },
  { key: "link", label: "QR 링크" },
  { key: "growth", label: "크기", defaultChecked: false },
  { key: "weight", label: "몸무게", defaultChecked: false },
];

function getFieldValue(pet: PetDto, key: ExportFieldKey, baseUrl: string): string {
  switch (key) {
    case "name":
      return pet.name ?? "";
    case "sex":
      return pet.sex ? (SEX_LABEL[pet.sex] ?? "") : "";
    case "morphs":
      return pet.morphs?.join(", ") ?? "";
    case "traits":
      return pet.traits?.join(", ") ?? "";
    case "growth":
      return pet.growth ? (GROWTH_KOREAN_INFO[pet.growth] ?? "") : "";
    case "weight":
      return pet.weight != null ? `${pet.weight}g` : "";
    case "hatchingDate":
      return pet.hatchingDate ? DateTime.fromISO(pet.hatchingDate).toFormat("yyyy-MM-dd") : "";
    case "parents": {
      const father = (pet.father as PetParentDto)?.name;
      const mother = (pet.mother as PetParentDto)?.name;
      if (father && mother) return `${father}x${mother}`;
      return father || mother || "";
    }
    case "link":
      return `${baseUrl}/pet/${pet.petId}`;
  }
}

export function exportPetExcel(pets: PetDto[], fields: ExportFieldKey[]) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const headers = fields.map((key) => EXPORT_FIELDS.find((f) => f.key === key)!.label);
  const rows = pets.map((pet) => fields.map((key) => getFieldValue(pet, key, baseUrl)));

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "개체목록");

  const date = DateTime.now().toFormat("yyyy-MM-dd");
  XLSX.writeFile(wb, `개체목록_${date}.xlsx`);
}
