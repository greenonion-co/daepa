import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { petControllerPreviewCsv, PetControllerPreviewCsv200Data } from "@repo/api-client";
import { toast } from "sonner";
import { CsvPreviewModal } from "./CsvPreviewModal";
import { overlay } from "overlay-kit";

interface CsvUploaderProps {
  acceptedTypes?: string[];
  maxSize?: number; // MB
}

export const CsvUploader = ({ acceptedTypes = [".csv"], maxSize = 10 }: CsvUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { mutate: previewCsv, isPending: isPreviewing } = useMutation({
    mutationFn: async (file: File) => {
      setSelectedFile(file);
      return petControllerPreviewCsv({ file });
    },
    onSuccess: (data) => {
      if (data.data?.data?.uploadedCount && data.data?.data?.uploadedCount > 0) {
        handleOpenPreviewModal(data.data.data);
      } else {
        toast.error("업로드할 수 있는 유효한 데이터가 없습니다.");
      }
      if (data.data?.data?.failedCount && data.data?.data?.failedCount > 0) {
        toast.error(`${data.data.data.failedCount}개의 행에서 오류가 발생했습니다.`);
      }
    },
    onError: (error) => {
      toast.error("CSV 파일 미리보기에 실패했습니다.");
      console.error("Preview error:", error);
    },
  });

  const handleOpenPreviewModal = (data: PetControllerPreviewCsv200Data) => {
    overlay.open(({ isOpen, close }) => (
      <CsvPreviewModal
        isOpen={isOpen}
        onClose={close}
        previewData={data}
        selectedFile={selectedFile}
      />
    ));
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 검증
    if (!acceptedTypes.some((type) => file.name.endsWith(type))) {
      setError("CSV 파일만 업로드 가능합니다.");
      return;
    }

    if (file.size > maxSize * 1024 * 1024) {
      setError(`파일 크기는 ${maxSize}MB 이하여야 합니다.`);
      return;
    }

    try {
      // 미리보기 실행
      previewCsv(file);
    } catch {
      setError("파일 업로드에 실패했습니다.");
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={isPreviewing}
            className="max-w-sm"
          />
        </div>

        {error && <div className="text-sm text-red-500">{error}</div>}

        {isPreviewing && (
          <div className="text-sm text-blue-500">
            {isPreviewing ? "파일을 분석하고 있습니다..." : "파일을 업로드하고 있습니다..."}
          </div>
        )}
      </div>
    </>
  );
};
