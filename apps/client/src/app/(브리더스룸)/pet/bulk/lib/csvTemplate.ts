/** 템플릿 CSV 헤더 — parsePetCsv의 COLUMN_MAP과 동기화되어야 함 */
const TEMPLATE_HEADERS = [
  "종",
  "개체 이름",
  "공개",
  "해칭일(YYYY-MM-DD)",
  "성별",
  "모프",
  "형질",
  "성장단계",
  "몸무게",
  "먹이",
  "브리더",
  "분양상태",
  "부개체",
  "모개체",
];

const TEMPLATE_EXAMPLES = [
  ["크레스티드게코", "대파", "TRUE", "2024-05-01", "수컷", "레드", "도체", "성체", "45", "판게아 인섹트", "TRUE", "NFS", "", ""],
  ["크레스티드게코", "소파", "FALSE", "2024-06-15", "암컷", "할리퀸, 타이거", "", "준성체", "32", "", "FALSE", "분양가능", "", ""],
];

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** 브라우저에서 CSV 템플릿 다운로드 트리거 */
export function downloadBulkPetTemplate() {
  const rows = [TEMPLATE_HEADERS, ...TEMPLATE_EXAMPLES];
  const csvBody = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  const bom = "\uFEFF"; // Excel UTF-8 인식용
  const blob = new Blob([bom + csvBody], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "breedy-bulk-pet-template.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
