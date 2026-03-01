"use client";

import { use } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import FamilyTreeCanvas from "./components/FamilyTreeCanvas";

interface FamilyTreePageProps {
  params: Promise<{
    petId: string;
  }>;
}

export default function FamilyTreePage({ params }: FamilyTreePageProps) {
  const { petId } = use(params);

  return (
    <div className="relative flex h-[calc(100dvh-52px)] flex-col">
      {/* 상단 헤더 */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
        <Link
          href={`/pet/${petId}`}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </Link>
        <span className="text-sm text-blue-600 dark:text-blue-200">
          * 처음 부모+2세대 표시 · 클릭으로 확장 가능
        </span>
      </div>

      {/* 캔버스 */}
      <div className="flex-1">
        <FamilyTreeCanvas petId={petId} />
      </div>
    </div>
  );
}
