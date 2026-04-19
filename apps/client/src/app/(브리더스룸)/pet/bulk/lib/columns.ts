import type { BulkPetRowValue } from "./bulkPetSchema";

export type ColumnType =
  | "text"
  | "number"
  | "date"
  | "checkbox"
  | "dropdown"
  | "multiSelect"
  | "parent"
  | "images"
  | "species"; // species는 종별 morph/trait 맵이 바뀌어서 별도 처리

export type ColumnDef = {
  field: keyof BulkPetRowValue;
  header: string;
  type: ColumnType;
  width: number;
  /** dropdown/select 계열: 이 모듈 밖에서 displayMap을 주입받아 사용 */
  dropdownKey?: "species" | "sex" | "growth" | "adoptionStatus";
  /** multiSelect: 종별 동적인 경우 별도 처리 */
  multiSelectKey?: "morphs" | "traits" | "foods";
  maxSelection?: number;
  parentRole?: "father" | "mother";
};

export const BULK_PET_COLUMNS: ColumnDef[] = [
  { field: "species", header: "종", type: "species", width: 40 },
  { field: "isPublic", header: "공개", type: "checkbox", width: 60 },
  { field: "name", header: "개체 이름", type: "text", width: 140 },
  { field: "images", header: "개체 사진", type: "images", width: 100 },
  { field: "hatchingDate", header: "해칭일", type: "date", width: 120 },
  { field: "isBreeder", header: "브리더", type: "checkbox", width: 60 },
  { field: "sex", header: "성별", type: "dropdown", dropdownKey: "sex", width: 70 },
  {
    field: "morphs",
    header: "모프",
    type: "multiSelect",
    multiSelectKey: "morphs",
    maxSelection: 5,
    width: 110,
  },
  {
    field: "traits",
    header: "형질",
    type: "multiSelect",
    multiSelectKey: "traits",
    maxSelection: 10,
    width: 110,
  },
  { field: "growth", header: "성장단계", type: "dropdown", dropdownKey: "growth", width: 80 },
  {
    field: "adoptionStatus",
    header: "분양상태",
    type: "dropdown",
    dropdownKey: "adoptionStatus",
    width: 80,
  },
  { field: "fatherName", header: "부개체", type: "parent", parentRole: "father", width: 120 },
  { field: "motherName", header: "모개체", type: "parent", parentRole: "mother", width: 120 },
  { field: "weight", header: "몸무게(g)", type: "number", width: 70 },
  {
    field: "foods",
    header: "먹이",
    type: "multiSelect",
    multiSelectKey: "foods",
    width: 100,
  },
];
