"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  adoptionHistoryControllerGetAllAdoptions,
  PriceRangeItemDto,
  AdoptionHistoryControllerGetAllAdoptionsSpecies,
} from "@repo/api-client";
import { cn, formatPrice } from "@/lib/utils";
import Loading from "@/components/common/Loading";
import { useIsMobile } from "@/hooks/useMobile";
import { Badge } from "@/components/ui/badge";
import SiblingPetCard from "@/app/(브리더스룸)/pet/[petId]/relation/components/SiblingPetCard";
import HorizontalScrollSection from "@/app/(브리더스룸)/pet/[petId]/relation/components/HorizontalScrollSection";

interface PriceRangePetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceRange: PriceRangeItemDto | null;
  species?: AdoptionHistoryControllerGetAllAdoptionsSpecies;
}

const ITEMS_PER_PAGE = 10;

const PriceRangePetsModal = ({
  isOpen,
  onClose,
  priceRange,
  species,
}: PriceRangePetsModalProps) => {
  const isMobile = useIsMobile();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["priceRangeAdoptions", priceRange?.minPrice, priceRange?.maxPrice, species],
    queryFn: ({ pageParam = 1 }) =>
      adoptionHistoryControllerGetAllAdoptions({
        page: pageParam,
        itemPerPage: ITEMS_PER_PAGE,
        minPrice: priceRange?.minPrice,
        maxPrice: priceRange?.maxPrice === -1 ? undefined : priceRange?.maxPrice,
        species,
        order: "DESC",
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.data.meta.hasNextPage) {
        return lastPage.data.meta.page + 1;
      }
      return undefined;
    },
    select: (data) => data.pages.flatMap((page) => page.data.data),
    enabled: isOpen && !!priceRange,
  });

  if (!priceRange) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90dvh] flex-col overflow-y-auto p-0 py-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 px-4">
            <span>{priceRange.label}</span>
            <Badge variant="secondary">{priceRange.count}마리</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* 가격대 요약 정보 */}
        <div className="mx-4 grid grid-cols-3 gap-3 rounded-xl bg-gradient-to-r from-blue-200/25 to-purple-200/25 p-4 dark:from-blue-900/30 dark:to-purple-900/30">
          <div className="text-center">
            <p className={cn("text-gray-500 dark:text-gray-400", isMobile ? "text-xs" : "text-sm")}>
              총 분양가
            </p>
            <p className={cn("font-bold text-emerald-600", isMobile ? "text-sm" : "text-lg")}>
              {formatPrice(priceRange.revenue)}
            </p>
          </div>
          <div className="text-center">
            <p className={cn("text-gray-500 dark:text-gray-400", isMobile ? "text-xs" : "text-sm")}>
              평균 분양가
            </p>
            <p className={cn("font-bold text-blue-600", isMobile ? "text-sm" : "text-lg")}>
              {formatPrice(priceRange.averagePrice)}
            </p>
          </div>
          <div className="text-center">
            <p className={cn("text-gray-500 dark:text-gray-400", isMobile ? "text-xs" : "text-sm")}>
              전체 분양 대비
            </p>
            <p className={cn("font-bold text-purple-600", isMobile ? "text-sm" : "text-lg")}>
              {priceRange.percentage}%
            </p>
          </div>
        </div>

        {/* 분양 목록 */}
        {isLoading ? (
          <Loading />
        ) : data && data.length > 0 ? (
          <section className="min-w-0 overflow-hidden">
            <HorizontalScrollSection
              className="mx-4"
              gradientColor="from-white"
              hasMore={hasNextPage}
              isLoading={isFetchingNextPage}
              onReachEnd={fetchNextPage}
            >
              {data.map((adoption) => (
                <SiblingPetCard
                  key={adoption.petId}
                  pet={adoption.pet}
                  price={adoption.price}
                  adoptionDate={adoption.adoptionDate}
                />
              ))}
            </HorizontalScrollSection>
          </section>
        ) : (
          <div className="py-8 text-center text-gray-500">해당 가격대의 분양 기록이 없습니다.</div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PriceRangePetsModal;
