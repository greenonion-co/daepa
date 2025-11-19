"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { AdoptionDto } from "@repo/api-client";
import { getStatusBadge } from "@/lib/utils";
import {
  ADOPTION_METHOD_KOREAN_INFO,
  GENDER_KOREAN_INFO,
  GROWTH_KOREAN_INFO,
  SPECIES_KOREAN_ALIAS_INFO,
  TABLE_HEADER,
} from "../../constants";
import { isNotNil } from "es-toolkit";

export const columns: ColumnDef<AdoptionDto>[] = [
  {
    accessorKey: "pet.species",
    header: TABLE_HEADER.species,
    cell: ({ row }) => {
      const species = row.original.pet.species;
      return <div className="capitalize">{SPECIES_KOREAN_ALIAS_INFO[species]}</div>;
    },
  },
  {
    accessorKey: "status",
    header: TABLE_HEADER.adoption_status,
    cell: ({ row }) => {
      const status = row.original.status;
      return <div className="flex">{getStatusBadge(status)}</div>;
    },
  },
  {
    accessorKey: "pet.name",
    header: TABLE_HEADER.name,
    cell: ({ row }) => {
      const petName = row.original.pet.name;
      return <div className="font-semibold">{petName}</div>;
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
    accessorKey: "pet.traits",
    header: "형질",
    cell: ({ row }) => {
      const traits = row.original.pet.traits;
      return (
        <div className="flex flex-wrap gap-1">
          {traits?.map((trait) => <Badge key={trait}>{trait}</Badge>)}
        </div>
      );
    },
  },
  {
    accessorKey: "pet.sex",
    header: "성별",
    cell: ({ row }) => {
      const sex = row.original.pet.sex;
      return <div className="capitalize">{sex ? GENDER_KOREAN_INFO[sex] : "-"}</div>;
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
    accessorKey: "buyer.name",
    header: "입양자",
    cell: ({ row }) => {
      const buyer = row.original?.buyer;
      // TODO!: 입양자 정보 보기 or 입양자 페이지로 이동
      return <div className="text-sm">{buyer ? buyer.name : "-"}</div>;
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
