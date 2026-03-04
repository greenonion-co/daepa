"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import type { BreederPublicProfile } from "../data";
import BreederHeader from "./BreederHeader";
import ShowcaseFilterBar, { type ShowcaseFilters } from "./ShowcaseFilterBar";
import PetShowcaseGrid from "./PetShowcaseGrid";
import ShowcaseMultiSelect from "./ShowcaseMultiSelect";
import { MORPH_LIST_BY_SPECIES, TRAIT_LIST_BY_SPECIES } from "@/app/(브리더스룸)/constants";
import { useIsLoggedIn } from "@/hooks/useAuth";
import { Share2 } from "lucide-react";
import { toast } from "@/lib/toast";
import Link from "next/link";

const SORT_DISPLAY: Record<string, string> = {
  DESC: "최신순",
  ASC: "오래된순",
};

interface ShowcaseContentProps {
  profile: BreederPublicProfile;
}

export default function ShowcaseContent({ profile }: ShowcaseContentProps) {
  const isLoggedIn = useIsLoggedIn();
  const [filters, setFilters] = useState<ShowcaseFilters>({
    sex: [],
    status: [],
    growth: [],
    morphs: [],
    traits: [],
    search: "",
    sort: "DESC",
  });

  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const allMorphs = useMemo(() => Object.assign({}, ...Object.values(MORPH_LIST_BY_SPECIES)), []);
  const allTraits = useMemo(() => Object.assign({}, ...Object.values(TRAIT_LIST_BY_SPECIES)), []);

  // 모바일 미니 헤더: BreederHeader가 스크롤 아웃되면 표시
  const headerRef = useRef<HTMLDivElement>(null);
  const [showMiniHeader, setShowMiniHeader] = useState(false);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowMiniHeader(!entry!.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleShare = () => {
    const url = `${window.location.origin}/@${encodeURIComponent(profile.name)}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("쇼룸 링크가 복사되었습니다");
    });
  };

  return (
    <div className="mx-auto md:flex md:h-dvh md:flex-col">
      {/* 모바일 미니 헤더 */}
      <div
        className={`fixed top-0 right-0 left-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white/80 px-4 py-2.5 backdrop-blur-sm transition-transform duration-300 md:hidden dark:border-gray-700 dark:bg-gray-900/80 ${
          showMiniHeader ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {profile.name}
            <span style={{ marginLeft: 4, fontFamily: "Yeongwol, sans-serif" }}>
              &#39;s SHOWROOM
            </span>
          </span>
          {profile.isBiz && (
            <span className="inline-flex items-center rounded-full bg-[#DBEDDB] px-2 py-0.5 text-[11px] leading-none font-medium text-[#2B6A2F] dark:bg-[#1E3D1F] dark:text-[#A3D9A5]">
              사업자
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-amber-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
        {!isLoggedIn && (
          <Link href="/sign-in" className="ml-auto px-3 py-1 text-xs font-medium text-blue-500">
            로그인
          </Link>
        )}
      </div>

      <div ref={headerRef}>
        <BreederHeader profile={profile} />
      </div>

      {/* 검색바 + 정렬 */}
      <div className="flex shrink-0 items-center gap-2 px-2 sm:px-4">
        <div className="relative flex-1">
          <svg
            className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="이름으로 검색"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full rounded-xl bg-white py-2 pr-3 pl-9 text-sm transition-colors outline-none placeholder:text-gray-400 focus:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:placeholder:text-gray-500 dark:focus:border-gray-500"
          />
        </div>
        <ShowcaseMultiSelect
          title="정렬"
          displayMap={SORT_DISPLAY}
          selected={[filters.sort]}
          onChange={(v) => setFilters({ ...filters, sort: v[0] || "DESC" })}
          single
          dropdownPosition="right"
          className="w-28"
        />
      </div>

      {/* 사이드바 필터 + 그리드 */}
      <div className="mt-3 md:flex md:min-h-0 md:flex-1">
        {/* 사이드바 필터 (데스크톱) */}
        <aside className="hidden w-65 shrink-0 px-4 md:block">
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <ShowcaseFilterBar
              filters={filters}
              onChange={setFilters}
              availableMorphs={allMorphs}
              availableTraits={allTraits}
            />
          </div>
        </aside>

        {/* 모바일 필터 + 그리드 */}
        <div className="md:flex-1 md:overflow-y-auto">
          {/* 모바일 필터 */}
          <div className="px-2 md:hidden">
            <ShowcaseFilterBar
              filters={filters}
              onChange={setFilters}
              availableMorphs={allMorphs}
              availableTraits={allTraits}
              mobile
            />
          </div>

          <PetShowcaseGrid
            userId={profile.userId}
            filters={{ ...filters, search: debouncedSearch }}
          />
        </div>
      </div>
    </div>
  );
}
