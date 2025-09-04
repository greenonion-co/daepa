"use client";

import { Column, ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BadgeCheck, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  FOOD_BADGE_COLORS,
  FOOD_BADGE_TEXT_COLORS,
  FOOD_LIST,
  GENDER_KOREAN_INFO,
  GROWTH_KOREAN_INFO,
  SALE_STATUS_KOREAN_INFO,
  SPECIES_KOREAN_INFO,
  STATUS_MAP,
  TABLE_HEADER,
} from "../../constants";
import {
  AdoptionDtoStatus,
  UpdateParentRequestDtoStatus,
  PetDto,
  PetDtoGrowth,
  PetDtoSpecies,
} from "@repo/api-client";
import LinkButton from "../../components/LinkButton";
import { format } from "date-fns";
import TableHeaderSelect from "../../components/TableHeaderSelect";
import { useFilterStore } from "../../store/filter";

const HeaderSelect = <TData,>({
  column,
  title,
  items,
  renderItem,
}: {
  column: Column<TData, unknown>;
  title: string;
  items: Array<string | number>;
  renderItem?: (item: string | number) => string;
}) => {
  const { searchFilters, setSearchFilters } = useFilterStore();
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

export const columns: ColumnDef<PetDto>[] = [
  {
    accessorKey: "isPublic",
    header: ({ column }) => {
      return (
        <HeaderSelect
          column={column}
          title={TABLE_HEADER.isPublic || ""}
          items={[1, 0]}
          renderItem={(item) => (item === 1 ? "공개" : "비공개")}
        />
      );
    },
    cell: ({ cell }) => {
      const isPublic = cell.getValue();
      return (
        <div className="text-center">
          <Badge variant={isPublic ? "default" : "outline"}>{isPublic ? "공개" : "비공개"}</Badge>
          <span className="sr-only">{isPublic ? "공개" : "비공개"}</span>
        </div>
      );
    },
  },

  {
    accessorKey: "adoption.status",
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
      return (
        <div className="max-w-[150px] truncate font-semibold" title={name}>
          {name}
        </div>
      );
    },
  },
  {
    accessorKey: "species",
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
      const species = row.getValue("species") as PetDtoSpecies;
      return <div className="capitalize">{SPECIES_KOREAN_INFO[species]}</div>;
    },
  },
  {
    accessorKey: "growth",
    header: ({ column }) => {
      const uniqueSizes = Object.keys(GROWTH_KOREAN_INFO);

      return (
        <HeaderSelect
          column={column}
          title={TABLE_HEADER.growth}
          items={uniqueSizes}
          renderItem={(item) => GROWTH_KOREAN_INFO[item as keyof typeof GROWTH_KOREAN_INFO]}
        />
      );
    },
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
    header: ({ column }) => {
      const uniqueSexes = Object.keys(GENDER_KOREAN_INFO);

      return (
        <HeaderSelect
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
    accessorKey: "hatchingDate",
    header: TABLE_HEADER.hatchingDate,
    cell: ({ row }) => {
      const hatchingDate = row.getValue("hatchingDate") as Date;
      return (
        <div className="capitalize">{hatchingDate ? format(hatchingDate, "yyyy-MM-dd") : "-"}</div>
      );
    },
  },
  {
    accessorKey: "mother",
    header: TABLE_HEADER.mother,
    cell: ({ row }) => {
      const mother = row.original.mother;
      const status = mother?.status ?? "approved";
      return mother?.petId ? (
        <LinkButton
          href={`/pet/${mother.petId}`}
          label={mother.name ?? ""}
          tooltip="펫 상세 페이지로 이동"
          // status가 없으면 내 펫
          className={`${STATUS_MAP[status].color} hover:text-accent/80 font-semibold text-white`}
          icon={
            status === UpdateParentRequestDtoStatus.APPROVED ? (
              <BadgeCheck className="h-4 w-4 text-gray-100" />
            ) : null
          }
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
      const status = father?.status ?? "approved";

      return father?.petId ? (
        <LinkButton
          href={`/pet/${father.petId}`}
          label={father.name ?? ""}
          tooltip="펫 상세 페이지로 이동"
          className={`${STATUS_MAP[status].color} hover:text-accent/80 font-semibold text-white`}
          icon={
            status === UpdateParentRequestDtoStatus.APPROVED ? (
              <BadgeCheck className="h-4 w-4 text-gray-100" />
            ) : null
          }
        />
      ) : (
        <span>-</span>
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
    header: ({ column }) => {
      const uniqueFoods = FOOD_LIST;

      return <HeaderSelect column={column} title={TABLE_HEADER.foods} items={uniqueFoods} />;
    },
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
