"use client";

import { Column, ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { AdoptionDto, AdoptionDtoStatus, PetDtoSpecies } from "@repo/api-client";
import { getStatusBadge } from "@/lib/utils";
import {
  GENDER_KOREAN_INFO,
  GROWTH_KOREAN_INFO,
  SALE_STATUS_KOREAN_INFO,
  SPECIES_KOREAN_INFO,
  TABLE_HEADER,
} from "../../constants";
import TableHeaderSelect from "../../components/TableHeaderSelect";
import { useAdoptionFilterStore } from "../../store/adoptionFilter";

const HeaderSelect = ({
  column,
  title,
  items,
  renderItem,
}: {
  column: Column<any, unknown>;
  title: string;
  items: string[] | number[];
  renderItem: (item: string | number) => string;
}) => {
  const { searchFilters, setSearchFilters } = useAdoptionFilterStore();
  return (
    <TableHeaderSelect
      column={column}
      title={title}
      items={items}
      searchFilters={searchFilters}
      setSearchFilters={setSearchFilters}
      renderItem={renderItem}
    />
  );
};

export const columns: ColumnDef<AdoptionDto>[] = [
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <HeaderSelect
          column={column}
          title={TABLE_HEADER.adoption_status}
          items={Object.values(AdoptionDtoStatus)}
          renderItem={(item) =>
            SALE_STATUS_KOREAN_INFO[item as keyof typeof SALE_STATUS_KOREAN_INFO] || "미정"
          }
        />
      );
    },
    cell: ({ row }) => {
      const status = row.original.status;
      return <div className="flex justify-center">{getStatusBadge(status)}</div>;
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
    accessorKey: "pet.species",
    header: ({ column }) => {
      const uniqueSpecies = Object.keys(SPECIES_KOREAN_INFO);

      return (
        <HeaderSelect
          column={column}
          title={TABLE_HEADER.species}
          items={uniqueSpecies}
          renderItem={(item) => SPECIES_KOREAN_INFO[item as PetDtoSpecies]}
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
    accessorKey: "price",
    header: "분양 가격",
    cell: ({ row }) => {
      const price = row.original.price;
      return (
        <div className="font-semibold text-blue-600">
          {price ? `${price.toLocaleString()}원` : "-"}
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
      return <div className="text-sm">{buyer ? buyer.name : "입양자 정보 없음"}</div>;
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
