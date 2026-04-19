"use client";

import Link from "next/link";
import { LayoutGrid } from "lucide-react";

/**
 * 개체 대량 등록 진입 버튼.
 * 내부 스프레드시트 페이지(/pet/bulk)로 이동. 이전의 파일 업로드 로직은 해당 페이지 내 툴바로 흡수되었음.
 */
const AddPetBulkButton = () => {
  return (
    <Link
      href="/pet/bulk"
      className="flex w-fit items-center gap-1 rounded-lg px-2 py-1 text-emerald-600 hover:bg-gray-100 dark:text-emerald-400 dark:hover:bg-gray-800"
    >
      <LayoutGrid className="h-3.5 w-3.5" />
      <span className="text-[14px] font-[500]">대량 등록</span>
    </Link>
  );
};

export default AddPetBulkButton;
