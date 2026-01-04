"use client";

import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";

import { SPECIES_KOREAN_INFO } from "../../constants";
import { PetDtoSpecies } from "@repo/api-client";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Cookie, Info } from "lucide-react";
import Image from "next/image";
import PetThumbnail from "@/components/common/PetThumbnail";
import BadgeList from "../BadgeList";

interface RecentlyViewedPet {
  petId: string;
  name: string;
  species?: PetDtoSpecies;
  photoUrl?: string;
  morphs?: string[];
  hatchingDate?: string;
}

const STORAGE_KEY = "recently_viewed_pets";
const MAX_ITEMS = 20;

const RecentlyViewedList = () => {
  const { petId } = useParams();
  const [items, setItems] = useState<RecentlyViewedPet[]>([]);

  useEffect(() => {
    const loadRecentlyViewed = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as RecentlyViewedPet[];
          setItems(parsed);
        }
      } catch (error) {
        console.error("Failed to load recently viewed pets:", error);
      }
    };

    loadRecentlyViewed();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadRecentlyViewed();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    const handleCustomStorageChange = () => {
      loadRecentlyViewed();
    };

    window.addEventListener("recentlyViewedUpdated", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("recentlyViewedUpdated", handleCustomStorageChange);
    };
  }, []);

  return (
    <>
      {items && items.length > 0 && (
        <div className="flex items-center gap-2 pl-4 text-red-500 dark:text-red-400">
          <Info size={14} />
          <div className="text-[14px]">최대 {MAX_ITEMS}개의 펫을 확인 가능합니다.</div>
        </div>
      )}
      <ScrollArea className="flex h-full flex-1 pb-[60px]">
        {items && items.length > 0 ? (
          <div className="flex flex-col p-2">
            {items.map((item) => (
              <Link
                key={item.petId}
                href={`/pet/${item.petId}`}
                className={cn(
                  "group flex items-center gap-3 rounded-xl p-2 hover:bg-gray-50 hover:shadow-lg dark:hover:bg-neutral-800",
                  item.petId === petId && "bg-gray-50 shadow-lg dark:bg-neutral-800",
                )}
              >
                {item.photoUrl ? (
                  <div className="h-10 w-10 flex-shrink-0">
                    <PetThumbnail petId={item.petId} alt={item.name} maxSize={40} />
                  </div>
                ) : (
                  <div className="relative h-10 w-10 rounded-xl bg-white">
                    <Image src="/assets/lizard.png" alt="최근본 기본 펫 이미지" fill />
                  </div>
                )}
                <div className="flex flex-1 justify-between gap-2 overflow-hidden">
                  <div className="flex w-20 max-w-20 items-center justify-between gap-2">
                    <span className="truncate font-bold dark:text-gray-100">{item.name}</span>
                  </div>
                  <div className="flex-1">
                    {item.species && (
                      <span className="text-muted-foreground truncate text-xs dark:text-gray-400">
                        {SPECIES_KOREAN_INFO[item.species]}
                      </span>
                    )}
                    <BadgeList
                      items={item.morphs}
                      badgeClassName="dark:bg-gray-700 dark:text-gray-200"
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
            <Cookie />
            <div className="mb-2 text-sm text-gray-800">최근 본 펫이 없습니다.</div>
          </div>
        )}
      </ScrollArea>
    </>
  );
};

export default RecentlyViewedList;
