import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PetControllerPreviewCsv200Data, petControllerUploadCsv } from "@repo/api-client";
import DataTable from "./DataTable";
import { modalColumns } from "./modalColums";
import { useMutation } from "@tanstack/react-query";

interface CsvPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewData: PetControllerPreviewCsv200Data;
  selectedFile: File | null;
}

export const CsvPreviewModal = ({
  isOpen,
  onClose,
  previewData,
  selectedFile,
}: CsvPreviewModalProps) => {
  const { mutate: uploadCsv, isPending: isUploading } = useMutation({
    mutationFn: async (file: File) => {
      return petControllerUploadCsv({ file });
    },
    onSuccess: (data) => {
      onClose();
      toast.success(`${data.data?.data?.uploadedCount}개의 펫이 성공적으로 업로드되었습니다.`);
      window.location.reload();
    },
    onError: (error) => {
      toast.error("CSV 파일 업로드에 실패했습니다.");
      console.error("Upload error:", error);
    },
  });

  const successData = previewData.previewData;
  const successCount = previewData.uploadedCount;
  const failedCount = previewData.failedCount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[90vh] w-[90vw] flex-col sm:max-h-none sm:max-w-none">
        <DialogHeader>
          <DialogTitle>CSV 업로드 미리보기</DialogTitle>
          <DialogDescription>
            업로드될 펫 정보를 확인해주세요. 총 {successCount}개의 펫이 업로드됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col space-y-4 overflow-hidden">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-600 text-sm text-white">{successCount}개 펫</Badge>
            <Badge variant="destructive" className="text-sm">
              {failedCount}개 펫 업로드 실패
            </Badge>
          </div>
          <div className="flex-1 overflow-auto">
            <DataTable
              columns={modalColumns}
              data={successData ?? []}
              hasFilter={false}
              loaderRefAction={() => {}}
              isClickable={false}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            취소
          </Button>
          <Button
            onClick={() => uploadCsv(selectedFile ?? new File([], ""))}
            disabled={isUploading}
          >
            {isUploading ? "업로드 중..." : "업로드 확인"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
