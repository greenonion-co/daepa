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
import { SALE_KOREAN_INFO, TABLE_HEADER } from "../../constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { PET } from "../types";

function TableHeaderSelect({
  column,
  title,
  items,
  renderItem = (item: string) => item,
}: {
  column: Column<PET, unknown>;
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

export const columns: ColumnDef<PET>[] = [
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
  },
  {
    accessorKey: "species",
    header: ({ column, table }) => {
      const uniqueSpecies = Array.from(
        new Set(table.getCoreRowModel().rows.map((row) => row.getValue("species") as string)),
      ).filter(Boolean);

      return (
        <TableHeaderSelect column={column} title={TABLE_HEADER.species} items={uniqueSpecies} />
      );
    },
  },
  {
    accessorKey: "size",
    header: ({ column, table }) => {
      const uniqueSizes = Array.from(
        new Set(table.getCoreRowModel().rows.map((row) => row.getValue("size") as string)),
      ).filter(Boolean);

      return <TableHeaderSelect column={column} title={TABLE_HEADER.size} items={uniqueSizes} />;
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("size")}</div>,
  },
  {
    accessorKey: "morph",
    header: TABLE_HEADER.morph,
    cell: ({ row }) => {
      const morphs = row.getValue("morph") as string[];

      return (
        <div className="flex flex-wrap gap-1">
          {morphs?.map((morph) => <Badge key={morph}>{morph}</Badge>)}
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

      return <TableHeaderSelect column={column} title={TABLE_HEADER.sex} items={uniqueSexes} />;
    },
  },
  {
    accessorKey: "weight",
    header: TABLE_HEADER.weight,
    cell: ({ row }) => <div className="capitalize">{row.getValue("weight") + "g"}</div>,
  },
  {
    accessorKey: "birthDate",
    header: TABLE_HEADER.birthDate,
  },
  {
    accessorKey: "mother",
    header: TABLE_HEADER.mother,
    cell: ({ row }) => {
      const mother = row.original.mother;
      return mother.id ? (
        <Button variant="ghost" asChild>
          <Link href={`/detail/${mother.id}`}>{mother.name}</Link>
        </Button>
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
      return father.id ? (
        <Button variant="ghost" asChild>
          <Link href={`/detail/${father.id}`}>{father.name}</Link>
        </Button>
      ) : (
        <span>-</span>
      );
    },
  },
  {
    accessorKey: "description",
    header: TABLE_HEADER.description,
  },
  {
    accessorKey: "food",
    header: ({ column, table }) => {
      const uniqueFoods = Array.from(
        new Set(table.getCoreRowModel().rows.map((row) => row.getValue("food") as string)),
      ).filter(Boolean);

      return <TableHeaderSelect column={column} title={TABLE_HEADER.food} items={uniqueFoods} />;
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
    cell: ({ row }) => <div className="capitalize">{row.getValue("breedingCount") + "회"}</div>,
  },
  {
    accessorKey: "pairing",
    header: TABLE_HEADER.pairing,
    cell: ({ row }) => {
      const pairing = row.original.pairing;
      return pairing?.id ? (
        <Button variant="ghost" asChild>
          <Link href={`/detail/${pairing.id}`}>{pairing.name}</Link>
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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(pet.id)}>
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
