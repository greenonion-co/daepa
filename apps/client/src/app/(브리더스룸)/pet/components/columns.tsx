"use client";

import { Column, ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  FOOD_BADGE_COLORS,
  FOOD_BADGE_TEXT_COLORS,
  GENDER_KOREAN_INFO,
  SALE_KOREAN_INFO,
  SPECIES_KOREAN_INFO,
  TABLE_HEADER,
} from "../../constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { PetDto } from "@repo/api-client";
import { formatDate } from "@/lib/utils";
import LinkButton from "../../components/LinkButton";

function TableHeaderSelect({
  column,
  title,
  items,
  renderItem = (item: string) => item,
}: {
  column: Column<PetDto, unknown>;
  title: string;
  items: string[];
  renderItem?: (item: string) => string;
}) {
  return (
    <div className="mb-1 mt-1 flex flex-col items-center">
      {title}
      <Select
        value={column.getFilterValue()?.toString() ?? "all"}
        onValueChange={(value) => column.setFilterValue(value === "all" ? "" : value)}
      >
        <SelectTrigger size="sm" className="mt-1">
          <SelectValue placeholder="전체" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          {items.map((item) => (
            <SelectItem key={item} value={item}>
              {renderItem(item)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export const columns: ColumnDef<PetDto>[] = [
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
    accessorKey: "name",
    header: TABLE_HEADER.name,
    cell: ({ row }) => {
      const name = row.original.name;
      return <div className="font-semibold">{name}</div>;
    },
  },
  {
    accessorKey: "species",
    header: ({ column, table }) => {
      const uniqueSpecies = Array.from(
        new Set(table.getCoreRowModel().rows.map((row) => row.getValue("species") as string)),
      ).filter(Boolean);

      return (
        <TableHeaderSelect
          column={column}
          title={TABLE_HEADER.species}
          items={uniqueSpecies}
          renderItem={(item) => SPECIES_KOREAN_INFO[item as keyof typeof SPECIES_KOREAN_INFO]}
        />
      );
    },
    cell: ({ row }) => {
      const species = row.getValue("species") as string;
      return (
        <div className="capitalize">
          {SPECIES_KOREAN_INFO[species as keyof typeof SPECIES_KOREAN_INFO]}
        </div>
      );
    },
  },
  {
    accessorKey: "growth",
    header: ({ column, table }) => {
      const uniqueSizes = Array.from(
        new Set(table.getCoreRowModel().rows.map((row) => row.getValue("growth") as string)),
      ).filter(Boolean);

      return <TableHeaderSelect column={column} title={TABLE_HEADER.growth} items={uniqueSizes} />;
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("growth")}</div>,
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
    header: ({ column, table }) => {
      const uniqueSexes = Array.from(
        new Set(table.getCoreRowModel().rows.map((row) => row.getValue("sex") as string)),
      ).filter(Boolean);

      return (
        <TableHeaderSelect
          column={column}
          title={TABLE_HEADER.sex}
          items={uniqueSexes}
          renderItem={(item) => GENDER_KOREAN_INFO[item as keyof typeof GENDER_KOREAN_INFO]}
        />
      );
    },
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
    accessorKey: "birthdate",
    header: TABLE_HEADER.birthdate,
    cell: ({ row }) => {
      const birthdate = row.getValue("birthdate") as string;
      return <div className="capitalize">{birthdate ? formatDate(birthdate) : "-"}</div>;
    },
  },
  {
    accessorKey: "mother",
    header: TABLE_HEADER.mother,
    cell: ({ row }) => {
      const mother = row.original.mother;
      return mother?.petId ? (
        <LinkButton
          href={`/pet/${mother.petId}`}
          label={mother.name ?? ""}
          tooltip="펫 상세 페이지로 이동"
        />
      ) : (
        <span>-</span>
      );
    },
  },
  {
    accessorKey: "father",
    header: TABLE_HEADER.father,
    cell: ({ row }) => {
      const father = row.original.father;
      return father?.petId ? (
        <LinkButton
          href={`/pet/${father.petId}`}
          label={father.name ?? ""}
          tooltip="펫 상세 페이지로 이동"
        />
      ) : (
        <span>-</span>
      );
    },
  },
  {
    accessorKey: "desc",
    header: TABLE_HEADER.desc,
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
              className={`font-bold ${FOOD_BADGE_COLORS[food as FOOD]} ${
                FOOD_BADGE_TEXT_COLORS[food as FOOD]
              }`}
            >
              {food}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "canBreed",
    header: ({ column }) => {
      return (
        <TableHeaderSelect
          column={column}
          title={TABLE_HEADER.canBreed}
          items={["true", "false"]}
          renderItem={(item) => (item === "true" ? "O" : "X")}
        />
      );
    },
    cell: ({ row }) => <div className="capitalize">{row.getValue("canBreed") ? "O" : "X"}</div>,
    filterFn: (row, id, filterValue) => {
      if (filterValue === "") return true;
      return row.getValue(id) === (filterValue === "true");
    },
  },
  {
    accessorKey: "breedingCount",
    header: TABLE_HEADER.breedingCount,
    cell: ({ row }) => {
      const mating = row.original.mating;

      return mating?.deliveryCount ? (
        <div className="capitalize">{mating.deliveryCount + "회"}</div>
      ) : (
        <span>-</span>
      );
    },
  },
  {
    accessorKey: "pairing",
    header: TABLE_HEADER.pairing,
    cell: ({ row }) => {
      const mating = row.original.mating;

      return mating?.pair ? (
        <Button variant="ghost" asChild>
          {mating.pair.map((pet) => (
            <Link key={pet.petId} href={`/detail/${pet.petId}`}>
              {pet.name}
            </Link>
          ))}
        </Button>
      ) : (
        <span>-</span>
      );
    },
  },
  {
    accessorKey: "saleInfo",
    header: ({ column, table }) => {
      const uniqueSaleInfos = Array.from(
        new Set(table.getCoreRowModel().rows.map((row) => row.getValue("saleInfo") as string)),
      ).filter(Boolean);

      return (
        <TableHeaderSelect
          column={column}
          title={TABLE_HEADER.saleInfo}
          items={uniqueSaleInfos}
          renderItem={(item) => SALE_KOREAN_INFO[item as keyof typeof SALE_KOREAN_INFO]}
        />
      );
    },
    cell: ({ row }) => {
      const saleInfo = row.getValue("saleInfo") as string;
      return (
        <div className="capitalize">
          {SALE_KOREAN_INFO[saleInfo as keyof typeof SALE_KOREAN_INFO]}
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const pet = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(pet.petId.toString())}>
              복사
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>예시</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
