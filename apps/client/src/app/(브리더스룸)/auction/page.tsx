"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  myAuctionControllerMyAuctions,
  type MyAuctionItemDto,
  MyAuctionItemDtoStatus,
} from "@repo/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PetThumbnail from "@/components/common/PetThumbnail";
import LoadingScreen from "@/app/loading";

const KRW = (n: number | null | undefined) =>
  typeof n === "number" ? `${n.toLocaleString("ko-KR")}원` : null;

const STATUS_META: Record<
  MyAuctionItemDtoStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "시작 전", variant: "secondary" },
  ACTIVE: { label: "진행 중", variant: "default" },
  ENDED: { label: "종료", variant: "outline" },
  CANCELED: { label: "취소됨", variant: "destructive" },
};

function formatDateRange(startMs: number, endMs: number): string {
  const start = new Date(startMs);
  const end = new Date(endMs);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  const startFmt = `${start.getFullYear()}.${String(start.getMonth() + 1).padStart(2, "0")}.${String(start.getDate()).padStart(2, "0")} ${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
  const endFmt = sameDay
    ? `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`
    : `${end.getFullYear()}.${String(end.getMonth() + 1).padStart(2, "0")}.${String(end.getDate()).padStart(2, "0")} ${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
  return `${startFmt} ~ ${endFmt}`;
}

function AuctionItemCard({ item }: { item: MyAuctionItemDto }) {
  const meta = STATUS_META[item.status];
  const showHighest =
    typeof item.highestBid === "number" &&
    item.highestBid > 0 &&
    item.status === MyAuctionItemDtoStatus.ACTIVE;
  const showFinal = typeof item.finalPrice === "number" && item.finalPrice > 0;

  return (
    <Link href={`/auction/${item.shareToken}`} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex gap-3 p-3">
          <div className="w-20 shrink-0">
            <PetThumbnail petId={item.petId} maxSize={160} objectFit="cover" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
            <div className="flex items-center gap-2">
              <Badge variant={meta.variant}>{meta.label}</Badge>
              <span className="truncate text-xs text-muted-foreground">
                {formatDateRange(item.startTimeMs, item.currentEndTimeMs)}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">시작가</span>{" "}
              <span className="font-medium tabular-nums">{KRW(item.startingPrice)}</span>
              {showHighest && (
                <>
                  <span className="mx-1 text-muted-foreground">·</span>
                  <span className="text-muted-foreground">현재가</span>{" "}
                  <span className="font-medium tabular-nums">{KRW(item.highestBid)}</span>
                </>
              )}
              {showFinal && (
                <>
                  <span className="mx-1 text-muted-foreground">·</span>
                  <span className="text-muted-foreground">낙찰가</span>{" "}
                  <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {KRW(item.finalPrice)}
                  </span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function AuctionList({ items }: { items: MyAuctionItemDto[] }) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-sm text-muted-foreground">해당하는 경매가 없습니다.</p>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.auctionId}>
          <AuctionItemCard item={item} />
        </li>
      ))}
    </ul>
  );
}

export default function MyAuctionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: [myAuctionControllerMyAuctions.name],
    queryFn: () => myAuctionControllerMyAuctions(),
    staleTime: 30 * 1000,
  });

  const items = useMemo(() => data?.data?.data ?? [], [data]);

  const grouped = useMemo(() => {
    const active: MyAuctionItemDto[] = [];
    const ended: MyAuctionItemDto[] = [];
    const canceled: MyAuctionItemDto[] = [];
    for (const item of items) {
      if (
        item.status === MyAuctionItemDtoStatus.PENDING ||
        item.status === MyAuctionItemDtoStatus.ACTIVE
      ) {
        active.push(item);
      } else if (item.status === MyAuctionItemDtoStatus.ENDED) {
        ended.push(item);
      } else if (item.status === MyAuctionItemDtoStatus.CANCELED) {
        canceled.push(item);
      }
    }
    return { active, ended, canceled };
  }, [items]);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="mx-auto w-full max-w-2xl p-4">
      <h1 className="mb-4 text-xl font-bold">내 경매</h1>
      <Tabs defaultValue="active">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            진행 중
            {grouped.active.length > 0 && (
              <span className="ml-1 text-xs">({grouped.active.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="ended">
            종료
            {grouped.ended.length > 0 && (
              <span className="ml-1 text-xs">({grouped.ended.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="canceled">
            취소
            {grouped.canceled.length > 0 && (
              <span className="ml-1 text-xs">({grouped.canceled.length})</span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-3">
          <AuctionList items={grouped.active} />
        </TabsContent>
        <TabsContent value="ended" className="mt-3">
          <AuctionList items={grouped.ended} />
        </TabsContent>
        <TabsContent value="canceled" className="mt-3">
          <AuctionList items={grouped.canceled} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
