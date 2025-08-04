"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import {
  FOOD_BADGE_COLORS,
  FOOD_BADGE_TEXT_COLORS,
  GENDER_KOREAN_INFO,
  GROWTH_KOREAN_INFO,
  SALE_STATUS_KOREAN_INFO,
  SPECIES_KOREAN_INFO,
  TABLE_HEADER,
} from "../../constants";

import { PetDto, PetDtoGrowth, PetDtoSpecies } from "@repo/api-client";
import { format } from "date-fns";

export const modalColumns: ColumnDef<PetDto>[] = [
  {
    accessorKey: "isPublic",
    header: TABLE_HEADER.isPublic,
    cell: ({ cell }) => <div className="capitalize">{cell.getValue() ? "✅" : ""}</div>,
  },
  {
    accessorKey: "adoption.status",
    header: TABLE_HEADER.adoption_status,
    cell: ({ cell }) => {
      const status = cell.getValue();
      return (
        <div className="capitalize">
          {SALE_STATUS_KOREAN_INFO[status as keyof typeof SALE_STATUS_KOREAN_INFO] || "미정"}
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: TABLE_HEADER.name,
    cell: ({ row }) => {
      const name = row.original.name;
      return <div className="font-semibold">{name}</div>;
    },
  },
  {
    accessorKey: "species",
    header: TABLE_HEADER.species,
    cell: ({ row }) => {
      const species = row.getValue("species") as PetDtoSpecies;
      return <div className="capitalize">{SPECIES_KOREAN_INFO[species]}</div>;
    },
  },
  {
    accessorKey: "growth",
    header: TABLE_HEADER.growth,
    cell: ({ row }) => {
      const growth = row.getValue("growth") as PetDtoGrowth;
      return <div>{GROWTH_KOREAN_INFO[growth]}</div>;
    },
  },
  {
    accessorKey: "morphs",
    header: TABLE_HEADER.morphs,
    cell: ({ row }) => {
      const morphs = row.original.morphs;
      return (
        <div className="flex flex-wrap gap-1">
          {morphs?.map((morph) => <Badge key={morph}>{morph}</Badge>)}
        </div>
      );
    },
  },
  {
    accessorKey: "traits",
    header: TABLE_HEADER.traits,
    cell: ({ row }) => {
      const traits = row.original.traits;

      return (
        <div className="flex flex-wrap gap-1">
          {traits?.map((trait) => (
            <Badge key={trait} variant="outline">
              {trait}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "sex",
    header: TABLE_HEADER.sex,
    cell: ({ row }) => {
      const sex = row.getValue("sex") as string;
      return (
        <div className="capitalize">
          {GENDER_KOREAN_INFO[sex as keyof typeof GENDER_KOREAN_INFO]}
        </div>
      );
    },
  },
  {
    accessorKey: "weight",
    header: TABLE_HEADER.weight,
    cell: ({ row }) => (
      <div className="capitalize">{row.original.weight ? row.getValue("weight") + "g" : "-"}</div>
    ),
  },
  {
    accessorKey: "hatchingDate",
    header: TABLE_HEADER.hatchingDate,
    cell: ({ row }) => {
      const hatchingDate = row.getValue("hatchingDate") as Date;
      if (typeof hatchingDate === "string") {
        return <div className="capitalize">{hatchingDate}</div>;
      }
      return (
        <div className="capitalize">{hatchingDate ? format(hatchingDate, "yyyy-MM-dd") : "-"}</div>
      );
    },
  },

  {
    accessorKey: "desc",
    header: TABLE_HEADER.desc,
    cell: ({ row }) => {
      const desc = row.getValue("desc") as string;
      return (
        <div className="capitalize">{desc?.length > 10 ? `${desc.slice(0, 10)}...` : desc}</div>
      );
    },
  },
  {
    accessorKey: "foods",
    header: TABLE_HEADER.foods,
    cell: ({ row }) => {
      const foods = row.getValue("foods") as string[];

      return (
        <div className="flex flex-wrap gap-1">
          {foods?.map((food) => (
            <Badge
              key={food}
              className={`font-bold ${FOOD_BADGE_COLORS[food]} ${FOOD_BADGE_TEXT_COLORS[food]}`}
            >
              {food}
            </Badge>
          ))}
        </div>
      );
    },
  },
];
