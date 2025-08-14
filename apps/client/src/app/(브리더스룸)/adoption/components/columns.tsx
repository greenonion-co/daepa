"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { AdoptionDto, AdoptionDtoStatus } from "@repo/api-client";
import { getStatusBadge } from "@/lib/utils";
import { SALE_STATUS_KOREAN_INFO, SPECIES_KOREAN_INFO, TABLE_HEADER } from "../../constants";
import TableHeaderSelect from "../../components/TableHeaderSelect";

export const columns: ColumnDef<AdoptionDto>[] = [
  {
    accessorKey: "pet.name",
    header: TABLE_HEADER.pet_name,
    cell: ({ row }) => {
      const petName = row.original.pet.name;
      return <div className="font-semibold">{petName}</div>;
    },
  },
  {
    accessorKey: "pet.species",
    header: ({ column }) => {
      const uniqueSpecies = Object.keys(SPECIES_KOREAN_INFO);

      return (
        <TableHeaderSelect
          column={column}
          title={TABLE_HEADER.pet_species}
          items={uniqueSpecies}
          renderItem={(item) => SPECIES_KOREAN_INFO[item as keyof typeof SPECIES_KOREAN_INFO]}
        />
      );
    },
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
    accessorKey: "pet.hatchingDate",
    header: "출생일",
    cell: ({ row }) => {
      const hatchingDate = row.original.pet.hatchingDate;
      return <div className="capitalize">{hatchingDate ?? "-"}</div>;
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <TableHeaderSelect
        column={column}
        title={TABLE_HEADER.status}
        items={Object.values(AdoptionDtoStatus)}
        renderItem={(item) =>
          SALE_STATUS_KOREAN_INFO[item as keyof typeof SALE_STATUS_KOREAN_INFO] || "미정"
        }
      />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      return <div className="flex justify-center">{getStatusBadge(status)}</div>;
    },
  },
  {
    accessorKey: "buyer.name",
    header: "입양자",
    cell: ({ row }) => {
      const buyer = row.original?.buyer;
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
