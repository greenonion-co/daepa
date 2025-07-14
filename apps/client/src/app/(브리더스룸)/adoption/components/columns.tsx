"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";

import { Badge } from "@/components/ui/badge";
import { AdoptionSummaryDto } from "@repo/api-client";
import { getStatusBadge } from "@/lib/utils";
import { formatDateToYYYYMMDDString } from "@/lib/utils";
import { SPECIES_KOREAN_INFO } from "../../constants";

export const columns: ColumnDef<AdoptionSummaryDto>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "pet.name",
    header: "펫 이름",
    cell: ({ row }) => {
      const petName = row.original.pet.name;
      return <div className="font-semibold">{petName}</div>;
    },
  },
  {
    accessorKey: "pet.species",
    header: "종",
    cell: ({ row }) => {
      const species = row.original.pet.species;
      return <div className="capitalize">{SPECIES_KOREAN_INFO[species]}</div>;
    },
  },
  {
    accessorKey: "pet.morphs",
    header: "모프",
    cell: ({ row }) => {
      const morphs = row.original.pet.morphs;
      return (
        <div className="flex flex-wrap gap-1">
          {morphs?.map((morph) => <Badge key={morph}>{morph}</Badge>)}
        </div>
      );
    },
  },
  {
    accessorKey: "pet.birthdate",
    header: "출생일",
    cell: ({ row }) => {
      const birthdate = row.original.pet.birthdate;
      return (
        <div className="capitalize">{birthdate ? formatDateToYYYYMMDDString(birthdate) : "-"}</div>
      );
    },
  },
  {
    accessorKey: "pet.saleStatus",
    header: "상태",
    cell: ({ row }) => {
      const saleStatus = row.original.pet.saleStatus;
      return <div className="flex justify-center">{getStatusBadge(saleStatus)}</div>;
    },
  },
  {
    accessorKey: "buyer.name",
    header: "입양자",
    cell: ({ row }) => {
      const buyer = row.original.buyer;
      return <div className="text-sm">{buyer ? buyer.name : "입양자 정보 없음"}</div>;
    },
  },
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
    accessorKey: "price",
    header: "분양 가격",
    cell: ({ row }) => {
      const price = row.original.price;
      return (
        <div className="font-semibold text-blue-600">
          {price ? `${price.toLocaleString()}원` : "미정"}
        </div>
      );
    },
  },
  {
    accessorKey: "memo",
    header: "메모",
    cell: ({ row }) => {
      const memo = row.original.memo;
      return <div className="text-sm text-gray-600">{memo || "-"}</div>;
    },
  },
];
