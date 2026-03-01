"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { brPetControllerFindAll, petControllerBulkCreate } from "@repo/api-client";
import { toast } from "@/lib/toast";
import { parsePetCsv } from "@/app/(브리더스룸)/lib/parsePetCsv";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AddPetBulkButton = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: petControllerBulkCreate,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 입력 초기화 (같은 파일 재선택 허용)
    e.target.value = "";

    try {
      const text = await file.text();
      const pets = parsePetCsv(text);

      const result = await mutateAsync({ pets });
      toast.success(result.data.message ?? `${pets.length}개의 개체가 등록되었습니다.`);
      queryClient.invalidateQueries({ queryKey: [brPetControllerFindAll.name] });
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message;
        const errorText = Array.isArray(message)
          ? message.join("\n")
          : message;
        setErrorMessage(errorText || "개체 등록 중 오류가 발생했습니다.");
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("개체 등록 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
        className="flex w-fit items-center rounded-lg px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
          <Upload className="h-3 w-3" />
        </div>
        <span className="px-2 py-1 text-[14px] font-[500] text-emerald-600 dark:text-emerald-400">
          {isPending ? "업로드 중..." : "CSV 파일 업로드"}
        </span>
      </button>

      <AlertDialog open={!!errorMessage}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>업로드 오류</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-wrap">
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorMessage(null)}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AddPetBulkButton;
