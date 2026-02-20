"use client";

import { ColumnDef } from "@tanstack/react-table";

import { AdoptionHistoryDto } from "@repo/api-client";
import { ADOPTION_METHOD_KOREAN_INFO, GROWTH_KOREAN_INFO, TABLE_HEADER } from "../../constants";
import { isNotNil } from "es-toolkit";
import LinkButton from "../../components/LinkButton";
import BadgeList from "../../components/BadgeList";
import DeletedPetName from "../../components/DeletedPetName";
import { getSexIcon } from "@/lib/sex-icon";

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

      return isDeleted ? (
        <DeletedPetName name={petName} />
      ) : (
        <span className="font-semibold">{petName ?? "-"}</span>
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
    accessorKey: "pet.sex",
    header: "성별",
    cell: ({ row }) => {
      const sex = row.original.pet.sex;
      return getSexIcon(sex, { size: "sm" });
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
    cell: ({ row }) => {
      const father = row.original.pet.father;
      if (!father) return null;

      return <LinkButton href={`/pet/${father.petId}`} label={father.name ?? ""} />;
    },
  },
  {
    id: "mother",
    accessorFn: (row) => row.pet.mother,
    header: "모개체",
    cell: ({ row }) => {
      const mother = row.original.pet.mother;
      if (!mother) return null;

      return <LinkButton href={`/pet/${mother.petId}`} label={mother.name ?? ""} />;
    },
  },
  {
    accessorKey: "memo",
    header: "메모",
    cell: ({ row }) => {
      const memo = row.original.memo;
      return <div className="text-sm text-gray-600">{memo}</div>;
    },
  },
];
