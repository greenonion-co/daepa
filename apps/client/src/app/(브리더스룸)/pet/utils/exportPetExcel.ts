import * as XLSX from "xlsx";
import { PetDto, PetParentDto } from "@repo/api-client";
import { GROWTH_KOREAN_INFO } from "../../constants";
import { DateTime } from "luxon";

export type ExportFieldKey =
  | "name"
  | "morphs"
  | "traits"
  | "growth"
  | "weight"
  | "hatchingDate"
  | "fatherName"
  | "motherName"
  | "link";

export const EXPORT_FIELDS: { key: ExportFieldKey; label: string }[] = [
  { key: "name", label: "이름" },
  { key: "morphs", label: "모프" },
  { key: "traits", label: "형질" },
  { key: "growth", label: "크기" },
  { key: "weight", label: "몸무게" },
  { key: "hatchingDate", label: "해칭일" },
  { key: "fatherName", label: "부개체" },
  { key: "motherName", label: "모개체" },
  { key: "link", label: "QR 링크" },
];

function getFieldValue(pet: PetDto, key: ExportFieldKey, baseUrl: string): string {
  switch (key) {
    case "name":
      return pet.name ?? "";
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
    case "fatherName":
      return (pet.father as PetParentDto)?.name ?? "";
    case "motherName":
      return (pet.mother as PetParentDto)?.name ?? "";
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
