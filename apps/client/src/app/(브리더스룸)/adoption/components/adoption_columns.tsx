"use client";

import { ColumnDef } from "@tanstack/react-table";

import { AdoptionHistoryDto } from "@repo/api-client";
import { ADOPTION_METHOD_KOREAN_INFO, GROWTH_KOREAN_INFO, TABLE_HEADER } from "../../constants";
import { isNotNil } from "es-toolkit";
import LinkButton from "../../components/LinkButton";
import BadgeList from "../../components/BadgeList";
import DeletedPetName from "../../components/DeletedPetName";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type TableMeta = {
  setPreviewOverridePetId?: (id: string | null) => void;
  setPreviewSuppressed?: (suppressed: boolean) => void;
};

export const columns: ColumnDef<AdoptionHistoryDto>[] = [
  {
    accessorKey: "adoptionDate",
    header: "분양 날짜",
    cell: ({ row }) => {
      const adoptionDate = row.original.adoptionDate;
      return (
        <div className="text-sm">
          {adoptionDate ? new Date(adoptionDate).toLocaleDateString("ko-KR") : "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "pet.name",
    header: TABLE_HEADER.name,
    cell: ({ row }) => {
      const petName = row.original.pet.name;
      const isDeleted = row.original.pet.isDeleted;
      const sex = row.original.pet.sex;
      const dotColor =
        sex === "M"
          ? "bg-[#2383E2] dark:bg-[#529CCA]"
          : sex === "F"
            ? "bg-[#E03E3E] dark:bg-[#FF7369]"
            : "bg-gray-300";

      return (
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
          {isDeleted ? (
            <DeletedPetName name={petName} />
          ) : (
            <span className="font-semibold">{petName ?? "-"}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "pet.morphs",
    header: "모프",
    cell: ({ row }) => {
      const morphs = row.original.pet.morphs;

      return <BadgeList variant={"outline"} items={morphs} />;
    },
  },
  {
    accessorKey: "pet.traits",
    header: "형질",
    cell: ({ row }) => {
      const traits = row.original.pet.traits;

      return <BadgeList items={traits} variant="secondary" badgeClassName="bg-white text-black" />;
    },
  },
  {
    accessorKey: "pet.growth",
    header: "크기",
    cell: ({ row }) => {
      const growth = row.original.pet.growth;
      return <div className="capitalize">{growth ? GROWTH_KOREAN_INFO[growth] : "-"}</div>;
    },
  },
  {
    accessorKey: "method",
    header: "분양 방식",
    cell: ({ row }) => {
      const method = row.original.method;
      return <div className="capitalize">{method ? ADOPTION_METHOD_KOREAN_INFO[method] : "-"}</div>;
    },
  },
  {
    accessorKey: "price",
    header: "분양 가격",
    cell: ({ row }) => {
      const price = row.original.price;
      return (
        <div className="font-semibold text-blue-600">
          {isNotNil(price) ? `${price.toLocaleString()}원` : "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "buyer.name",
    header: "입양자",
    cell: ({ row }) => {
      const buyer = row.original?.buyer;
      // TODO!: 입양자 정보 보기 or 입양자 페이지로 이동
      return <div className="text-sm">{buyer ? buyer.name : "-"}</div>;
    },
  },
  {
    id: "father",
    header: "부개체",
    accessorFn: (row) => row.pet.father,
    cell: ({ row, table }) => {
      const father = row.original.pet.father;
      if (!father) return null;
      const setPreview = (table.options.meta as TableMeta)?.setPreviewOverridePetId;

      return (
        <span
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setPreview?.(father.petId)}
          onMouseLeave={() => setPreview?.(null)}
        >
          <LinkButton href={`/pet/${father.petId}`} label={father.name ?? ""} />
        </span>
      );
    },
  },
  {
    id: "mother",
    accessorFn: (row) => row.pet.mother,
    header: "모개체",
    cell: ({ row, table }) => {
      const mother = row.original.pet.mother;
      if (!mother) return null;
      const setPreview = (table.options.meta as TableMeta)?.setPreviewOverridePetId;

      return (
        <span
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setPreview?.(mother.petId)}
          onMouseLeave={() => setPreview?.(null)}
        >
          <LinkButton href={`/pet/${mother.petId}`} label={mother.name ?? ""} />
        </span>
      );
    },
  },
  {
    accessorKey: "memo",
    header: "메모",
    cell: ({ row, table }) => {
      const memo = row.original.memo;
      if (!memo) return null;
      const setSuppressed = (table.options.meta as TableMeta)?.setPreviewSuppressed;

      const truncated = memo.length > 10;
      const displayText = truncated ? `${memo.slice(0, 10)}…` : memo;

      if (!truncated) {
        return <div className="text-sm text-gray-600">{displayText}</div>;
      }

      return (
        <span onMouseEnter={() => setSuppressed?.(true)} onMouseLeave={() => setSuppressed?.(false)}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-default text-sm text-gray-600">{displayText}</div>
            </TooltipTrigger>
            <TooltipContent className="max-w-[300px] whitespace-pre-wrap">
              {memo}
            </TooltipContent>
          </Tooltip>
        </span>
      );
    },
  },
];
