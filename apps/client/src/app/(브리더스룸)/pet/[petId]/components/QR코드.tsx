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
import { SPECIES_KOREAN_ALIAS_INFO, GENDER_KOREAN_INFO } from "@/app/(브리더스룸)/constants";
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
  qrSize: number;
  padding: number;
  lineHeight: number;
  fontSize: number;
};

const SIZE_OPTIONS: sizeOption[] = [
  { id: "small", label: "S", qrSize: 150, padding: 16, lineHeight: 22, fontSize: 14 },
  { id: "medium", label: "M", qrSize: 200, padding: 20, lineHeight: 26, fontSize: 16 },
  { id: "large", label: "L", qrSize: 280, padding: 24, lineHeight: 32, fontSize: 20 },
];

const PET_INFO_OPTIONS: PetInfoOption[] = [
  { id: "name", label: "이름", getValue: (pet) => pet.name || null },
  {
    id: "species",
    label: "종",
    getValue: (pet) => SPECIES_KOREAN_ALIAS_INFO[pet.species] || null,
  },
  { id: "morphs", label: "모프", getValue: (pet) => pet.morphs?.slice(0, 3).join(" ") || null },
  { id: "traits", label: "형질", getValue: (pet) => pet.traits?.slice(0, 3).join(" ") || null },
  { id: "foods", label: "먹이", getValue: (pet) => pet.foods?.slice(0, 3).join(" ") || null },
  {
    id: "sex",
    label: "성별",
    getValue: (pet) => (pet.sex ? GENDER_KOREAN_INFO[pet.sex] : null),
  },
  {
    id: "hatchingDate",
    label: "해칭일",
    getValue: (pet) =>
      pet.hatchingDate ? DateTime.fromISO(pet.hatchingDate).toFormat("yyyy.MM.dd") : null,
  },
];

const QRCode = ({ pet, isScrolled }: QRCodeProps) => {
  const isMyPet = useIsMyPet(pet.owner.userId);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [previewDataUrl, setPreviewDataUrl] = useState<string>("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState<string>("medium");
  const [isDownloading, setIsDownloading] = useState(false);

  // QR 코드 생성
  useEffect(() => {
    const fetchQrCode = async () => {
      const currentUrl = window.location.href;
      const qrCodeDataUrl = await generateQRCode(currentUrl);
      setQrCodeDataUrl(qrCodeDataUrl);
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

    await new Promise((resolve) => {
      qrImage.onload = resolve;
    });

    const sizeConfig = SIZE_OPTIONS.find((s) => s.id === selectedSize) ?? SIZE_OPTIONS[1]!;
    const { qrSize, padding, lineHeight, fontSize } = sizeConfig;

    // 선택된 정보 필터링 (id 포함)
    const selectedInfo = PET_INFO_OPTIONS.filter(
      (opt) => selectedOptions.includes(opt.id) && opt.getValue(pet),
    ).map((opt) => ({ id: opt.id, label: opt.label, value: opt.getValue(pet)! }));

    const infoHeight = selectedInfo.length > 0 ? selectedInfo.length * lineHeight + padding : 0;
    const totalHeight = qrSize + padding * 2 + infoHeight;
    const totalWidth = qrSize + padding * 2;

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    // 배경
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    // QR 코드
    ctx.drawImage(qrImage, padding, padding, qrSize, qrSize);

    // 펫 정보
    if (selectedInfo.length > 0) {
      ctx.fillStyle = "#333333";
      ctx.textAlign = "center";

      selectedInfo.forEach((info, index) => {
        // 이름은 bold 처리
        const fontWeight = info.id === "name" ? "bold" : "normal";
        ctx.font = `${fontWeight} ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        const y = qrSize + padding * 1.5 + index * lineHeight + fontSize;
        ctx.fillText(info.value, totalWidth / 2, y);
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
            <DialogTitle>{pet.name ? `${pet.name}의 QR 코드` : "펫 프로필 QR 코드"}</DialogTitle>
          </DialogHeader>

          <div className={cn("flex items-center gap-4", !isMyPet && "flex-col")}>
            {/* QR 코드 미리보기 */}
            <div
              className={cn(
                "flex items-center justify-center rounded-lg bg-white p-2",
                isMyPet && "border",
              )}
            >
              {previewDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewDataUrl} alt="QR Code Preview" className="max-h-[280px]" />
              ) : (
                <div className="flex h-[200px] w-[200px] items-center justify-center text-sm text-gray-500">
                  QR 코드를 생성 중입니다...
                </div>
              )}
            </div>

            {isMyPet && (
              <div className="flex w-fit flex-col gap-3">
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
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-neutral-800">
                  <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    포함할 정보
                  </p>
                  <div className="grid grid-cols-2 gap-1">
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
                          <span className="text-sm text-gray-600 dark:text-gray-400">
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
              <Button onClick={downloadImage} disabled={isDownloading || !previewDataUrl}>
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
