import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export interface TransferReportData {
  type: "transfer" | "receive" | "custody"; // 양도 / 양수 / 보관
  seller: { name: string; phone: string; address: string }; // 양도인
  buyer: { name: string; phone: string; address: string }; // 양수인(보관인)
  animal: {
    scientificName: string;
    quantity: string;
    purpose: string;
    reason: string;
  };
  date: { year: string; month: string; day: string };
  reporter: string; // 신고인
}

// PDF page: 595 x 841 pt (A4)
// Coordinates are measured from bottom-left origin
const FONT_SIZE = 10;
const CHECK_SIZE = 14;

// ── Title checkboxes: [ ] 양도  [ ] 양수  [ ] 보관 ──
const TITLE_CHECKS = {
  transfer: { x: 206, y: 745 },
  receive: { x: 270, y: 745 },
  custody: { x: 336, y: 745 },
} as const;

// ── 양도인 (seller) fields ──
const SELLER = {
  name: { x: 190, y: 671 },
  phone: { x: 430, y: 671 },
  address: { x: 180, y: 642 },
} as const;

// ── 양수인/보관인 (buyer) fields ──
const BUYER = {
  name: { x: 190, y: 610 },
  phone: { x: 430, y: 610 },
  address: { x: 180, y: 580 },
} as const;

// ── 야생동물 정보 (animal info) ──
const ANIMAL = {
  scientificName: { x: 132, y: 529 },
  quantity: { x: 270, y: 529 },
  purpose: { x: 310, y: 529 },
  reason: { x: 430, y: 529 },
} as const;

// ── Body text checkboxes: [ ]양도, [ ]양수, [ ]보관 ──
const BODY_CHECKS = {
  transfer: { x: 260, y: 395 },
  receive: { x: 315, y: 395 },
  custody: { x: 370, y: 395 },
} as const;

// ── Date: 년 월 일 ──
const DATE = {
  year: { x: 430, y: 380 },
  month: { x: 474, y: 380 },
  day: { x: 507, y: 380 },
} as const;

// ── 신고인 ──
const REPORTER = { x: 395, y: 364 } as const;

export async function generateTransferReport(data: TransferReportData): Promise<void> {
  // 1. Load existing PDF template
  const pdfResponse = await fetch("/files/양도양수보관신고서.pdf");
  const pdfBytes = await pdfResponse.arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // 2. Register fontkit & embed Korean font
  pdfDoc.registerFontkit(fontkit);
  const fontResponse = await fetch("/fonts/PretendardVariable.ttf");
  const fontBytes = await fontResponse.arrayBuffer();
  const font = await pdfDoc.embedFont(fontBytes);

  // 3. Get the first page
  const page = pdfDoc.getPages()[0];
  if (!page) {
    throw new Error("PDF 템플릿에 페이지가 없습니다.");
  }
  const color = rgb(0, 0, 0);

  const draw = (text: string, pos: { x: number; y: number }, size = FONT_SIZE) => {
    page.drawText(text, { x: pos.x, y: pos.y, size, font, color });
  };

  // 4. Draw checkmarks for type
  const checkmark = "✓";
  draw(checkmark, TITLE_CHECKS[data.type], CHECK_SIZE);
  draw(checkmark, BODY_CHECKS[data.type], CHECK_SIZE);

  // 5. Draw seller info
  draw(data.seller.name, SELLER.name);
  draw(data.seller.phone, SELLER.phone);
  draw(data.seller.address, SELLER.address);

  // 6. Draw buyer info
  draw(data.buyer.name, BUYER.name);
  draw(data.buyer.phone, BUYER.phone);
  draw(data.buyer.address, BUYER.address);

  // 7. Draw animal info
  draw(data.animal.scientificName, ANIMAL.scientificName);
  draw(data.animal.quantity, ANIMAL.quantity);
  draw(data.animal.purpose, ANIMAL.purpose);

  // Reason may be long — split into multiple lines if needed
  const reasonLines = splitText(data.animal.reason, 12);
  reasonLines.forEach((line, i) => {
    draw(line, { x: ANIMAL.reason.x, y: ANIMAL.reason.y - i * 14 });
  });

  // 8. Draw date
  draw(data.date.year, DATE.year);
  draw(data.date.month, DATE.month);
  draw(data.date.day, DATE.day);

  // 9. Draw reporter
  draw(data.reporter, REPORTER);

  // 10. Save & trigger download
  const modifiedBytes = await pdfDoc.save();
  const blob = new Blob([modifiedBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "양도양수보관신고서.pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function splitText(text: string, maxCharsPerLine: number): string[] {
  if (text.length <= maxCharsPerLine) return [text];
  const lines: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    lines.push(remaining.slice(0, maxCharsPerLine));
    remaining = remaining.slice(maxCharsPerLine);
  }
  return lines;
}
