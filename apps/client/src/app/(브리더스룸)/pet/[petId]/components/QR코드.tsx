"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, generateQRCode } from "@/lib/utils";
import { useEffect, useState, useCallback } from "react";
import { PetDto } from "@repo/api-client";
import { GENDER_KOREAN_INFO } from "@/app/(브리더스룸)/constants";
import { DateTime } from "luxon";
import { useIsMyPet } from "@/hooks/useIsMyPet";

interface QRCodeProps {
  pet: PetDto;
  isScrolled: boolean;
}

type PetInfoOption = {
  id: string;
  label: string;
  getValue: (pet: PetDto) => string | null;
};

type sizeOption = {
  id: "small" | "medium" | "large";
  label: "S" | "M" | "L";
  width: number;
  height: number;
  padding: number;
  lineHeight: number;
  fontSize: number;
};

const SIZE_OPTIONS: sizeOption[] = [
  { id: "small", label: "S", width: 240, height: 70, padding: 5, lineHeight: 14, fontSize: 10 },
  { id: "medium", label: "M", width: 340, height: 120, padding: 8, lineHeight: 22, fontSize: 16 },
  { id: "large", label: "L", width: 520, height: 200, padding: 20, lineHeight: 36, fontSize: 24 },
];

const PET_INFO_OPTIONS: PetInfoOption[] = [
  // {
  //   id: "species",
  //   label: "종",
  //   getValue: (pet) => SPECIES_KOREAN_ALIAS_INFO[pet.species] || null,
  // },
  { id: "name", label: "이름", getValue: (pet) => pet.name || null },
  {
    id: "hatchingDate",
    label: "해칭일",
    getValue: (pet) =>
      pet.hatchingDate ? DateTime.fromISO(pet.hatchingDate).toFormat("yy.MM.dd") : null,
  },
  {
    id: "sex",
    label: "성별",
    getValue: (pet) => (pet.sex ? GENDER_KOREAN_INFO[pet.sex] : null),
  },
  {
    id: "father",
    label: "부개체",
    getValue: (pet) =>
      pet.father && "name" in pet.father && pet.father.status === "approved" && pet.father.name
        ? pet.father.name
        : null,
  },
  {
    id: "mother",
    label: "모개체",
    getValue: (pet) =>
      pet.mother && "name" in pet.mother && pet.mother.status === "approved" && pet.mother.name
        ? pet.mother.name
        : null,
  },
  { id: "morphs", label: "모프", getValue: (pet) => pet.morphs?.slice(0, 3).join(" ") || null },
  { id: "traits", label: "형질", getValue: (pet) => pet.traits?.slice(0, 3).join(" ") || null },
  // { id: "foods", label: "먹이", getValue: (pet) => pet.foods?.slice(0, 3).join(" | ") || null },
];

const QRCode = ({ pet, isScrolled }: QRCodeProps) => {
  const isMyPet = useIsMyPet(pet.owner.userId);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [previewDataUrl, setPreviewDataUrl] = useState<string>("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    PET_INFO_OPTIONS.filter((opt) => opt.getValue(pet)).map((opt) => opt.id),
  );
  const [selectedSize, setSelectedSize] = useState<string>("medium");
  const [isDownloading, setIsDownloading] = useState(false);
  const [qrError, setQrError] = useState(false);
  console.log(pet);
  // QR 코드 생성
  useEffect(() => {
    const fetchQrCode = async () => {
      try {
        setQrError(false);
        const petUrl = `${window.location.origin}/pet/${pet.petId}`;
        const dataUrl = await generateQRCode(petUrl);
        setQrCodeDataUrl(dataUrl);
      } catch {
        setQrError(true);
      }
    };
    fetchQrCode();
  }, [pet.petId]);

  // 미리보기 이미지 생성
  const generatePreview = useCallback(async () => {
    if (!qrCodeDataUrl) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const qrImage = new Image();
    qrImage.src = qrCodeDataUrl;

    try {
      await new Promise<void>((resolve, reject) => {
        qrImage.onload = () => resolve();
        qrImage.onerror = () => reject(new Error("QR 이미지 로드 실패"));
      });
    } catch {
      setQrError(true);
      return;
    }

    const sizeConfig = SIZE_OPTIONS.find((s) => s.id === selectedSize) ?? SIZE_OPTIONS[1]!;
    const { width, height, padding, lineHeight, fontSize } = sizeConfig;
    const qrSize = height - padding * 2;
    const fontFamily = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

    // 선택된 정보 필터링 (id 포함)
    const selectedInfo = PET_INFO_OPTIONS.filter(
      (opt) => selectedOptions.includes(opt.id) && opt.getValue(pet),
    ).map((opt) => ({ id: opt.id, label: opt.label, value: opt.getValue(pet)! }));

    // 같은 줄로 합칠 그룹 정의
    const INLINE_GROUPS = [
      { ids: new Set(["name", "hatchingDate", "sex"]), separator: "  ", bold: true },
      { ids: new Set(["father", "mother"]), separator: " x ", bold: false },
    ];

    // 줄 단위 텍스트 구성: [{text, bold}]
    const infoLines: { text: string; bold: boolean }[] = [];
    const usedIds = new Set<string>();

    for (const group of INLINE_GROUPS) {
      const groupItems = selectedInfo.filter((i) => group.ids.has(i.id));
      if (groupItems.length > 0) {
        groupItems.forEach((i) => usedIds.add(i.id));
        infoLines.push({
          text: groupItems.map((i) => i.value).join(group.separator),
          bold: group.bold,
        });
      }
    }
    for (const item of selectedInfo.filter((i) => !usedIds.has(i.id))) {
      infoLines.push({ text: item.value, bold: false });
    }

    const hasInfo = infoLines.length > 0;
    const totalWidth = hasInfo ? width : qrSize + padding * 2;
    const totalHeight = height;
    const infoMaxWidth = totalWidth - qrSize - padding * 3;

    // 텍스트 줄바꿈 계산 (임시 캔버스 크기 설정)
    const wrappedLines: { text: string; bold: boolean }[] = [];
    if (hasInfo) {
      canvas.width = 1000;
      canvas.height = 1000;
      for (const line of infoLines) {
        ctx.font = `${line.bold ? "bold" : "normal"} ${fontSize}px ${fontFamily}`;
        let currentLine = "";
        for (const char of line.text) {
          const testLine = currentLine + char;
          if (ctx.measureText(testLine).width > infoMaxWidth && currentLine.length > 0) {
            wrappedLines.push({ text: currentLine, bold: line.bold });
            currentLine = char;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) wrappedLines.push({ text: currentLine, bold: line.bold });
      }
    }

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    // 배경
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    // QR 코드 (세로 중앙 정렬)
    ctx.drawImage(qrImage, padding, padding, qrSize, qrSize);

    // 펫 정보 (QR 우측, 세로 중앙 정렬)
    if (hasInfo) {
      const infoHeight = wrappedLines.length * lineHeight;
      ctx.fillStyle = "#333333";
      ctx.textAlign = "left";
      const infoX = qrSize + padding * 2;
      const infoStartY = (totalHeight - infoHeight) / 2;

      wrappedLines.forEach((line, index) => {
        ctx.font = `${line.bold ? "bold" : "normal"} ${fontSize}px ${fontFamily}`;
        ctx.fillText(line.text, infoX, infoStartY + index * lineHeight + fontSize);
      });
    }

    setPreviewDataUrl(canvas.toDataURL("image/png"));
  }, [qrCodeDataUrl, selectedOptions, selectedSize, pet]);

  // qrCodeDataUrl 또는 selectedOptions 변경 시 미리보기 업데이트
  useEffect(() => {
    generatePreview();
  }, [generatePreview]);

  const toggleOption = (optionId: string) => {
    setSelectedOptions((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId],
    );
  };

  const downloadImage = useCallback(() => {
    if (!previewDataUrl) return;
    setIsDownloading(true);

    try {
      const a = document.createElement("a");
      a.href = previewDataUrl;
      a.download = `${pet.name || "pet"}-qr.png`;
      a.click();
    } finally {
      setIsDownloading(false);
    }
  }, [previewDataUrl, pet.name]);

  return (
    <div className="ml-auto">
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className={cn(isScrolled ? "text-xs" : "text-sm")}>
            QR
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR CODE</DialogTitle>
          </DialogHeader>

          <div className={cn("flex flex-col items-center gap-4", !isMyPet && "flex-col")}>
            {/* QR 코드 미리보기 */}
            <div
              className={cn(
                "flex w-full items-center justify-center rounded-lg bg-white p-2",
                isMyPet && "",
              )}
            >
              {qrError ? (
                <div className="flex h-[200px] w-[200px] items-center justify-center text-sm text-red-500">
                  QR 코드 생성에 실패했습니다
                </div>
              ) : previewDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewDataUrl} alt="QR Code Preview" className="max-h-[280px]" />
              ) : (
                <div className="flex h-[200px] w-[200px] items-center justify-center text-sm text-gray-500">
                  QR 코드를 생성 중입니다...
                </div>
              )}
            </div>

            {isMyPet && (
              <div className="flex w-full flex-col gap-3">
                {/* 크기 선택 */}
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-neutral-800">
                  <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">크기</p>
                  <div className="flex gap-2">
                    {SIZE_OPTIONS.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSize(size.id)}
                        className={cn(
                          "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                          selectedSize === size.id
                            ? "bg-neutral-800 text-white dark:bg-white dark:text-neutral-800"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-600",
                        )}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 포함할 정보 */}
                <div className="w-full rounded-lg bg-gray-50 p-3 dark:bg-neutral-800">
                  <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    포함 정보
                  </p>
                  <div className={cn("flex flex-wrap justify-between gap-1")}>
                    {PET_INFO_OPTIONS.map((option) => {
                      const value = option.getValue(pet);
                      if (!value) return null;

                      return (
                        <label
                          key={option.id}
                          className="flex cursor-pointer items-center gap-1 rounded-md p-0.5 hover:bg-gray-100 dark:hover:bg-neutral-700"
                        >
                          <Checkbox
                            checked={selectedOptions.includes(option.id)}
                            onCheckedChange={() => toggleOption(option.id)}
                          />
                          <span className="text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                            {option.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {isMyPet && (
              <Button
                onClick={downloadImage}
                disabled={isDownloading || !previewDataUrl || qrError}
              >
                {isDownloading ? "생성 중..." : "다운로드"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QRCode;
