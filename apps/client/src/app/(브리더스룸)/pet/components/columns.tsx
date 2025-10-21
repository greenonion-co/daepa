"use client";

import { Lock, LockOpen } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  GENDER_KOREAN_INFO,
  GROWTH_KOREAN_INFO,
  SALE_STATUS_KOREAN_INFO,
  SPECIES_KOREAN_ALIAS_INFO,
  SPECIES_KOREAN_INFO,
  STATUS_MAP,
  TABLE_HEADER,
} from "../../constants";
import {
  UpdateParentRequestDtoStatus,
  PetDto,
  PetDtoGrowth,
  PetDtoSpecies,
  PetParentDto,
  PetHiddenStatusDtoHiddenStatus,
  AdoptionDto,
} from "@repo/api-client";
import LinkButton from "../../components/LinkButton";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import TooltipText from "../../components/TooltipText";

export const columns: ColumnDef<PetDto>[] = [
  {
    accessorKey: "isPublic",
    header: () => {
      return (
        <TooltipText
          text="공개"
          title="공개 여부"
          description="펫의 공개 여부를 나타냅니다."
          content="비공개 펫은 다른 브리더에게 공개되지 않습니다."
        />
      );
    },
    cell: ({ cell }) => {
      const isPublic = cell.getValue();
      return (
        <div className="text-center">
          {isPublic ? (
            <LockOpen className="h-4 w-4 text-blue-600" />
          ) : (
            <Lock className="h-4 w-4 text-red-600" />
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "species",
    header: TABLE_HEADER.species,
    cell: ({ row }) => {
      const species = row.getValue("species") as PetDtoSpecies;
      return (
        <TooltipText
          title="종"
          text={SPECIES_KOREAN_ALIAS_INFO[species]}
          content={SPECIES_KOREAN_INFO[species]}
        />
      );
    },
  },
  {
    accessorKey: "adoption",
    header: TABLE_HEADER.adoption_status,
    cell: ({ cell }) => {
      const adoptionData = cell.getValue() as AdoptionDto;

      if (!adoptionData?.status) return <span>미정</span>;

      return (
        <TooltipText
          title={
            SALE_STATUS_KOREAN_INFO[adoptionData?.status as keyof typeof SALE_STATUS_KOREAN_INFO]
          }
          text={
            SALE_STATUS_KOREAN_INFO[adoptionData?.status as keyof typeof SALE_STATUS_KOREAN_INFO] ||
            "미정"
          }
          description={adoptionData?.memo ?? ""}
          content={
            <div className="capitalize">
              <div>
                가격・{adoptionData?.price ? `${adoptionData?.price?.toLocaleString()}원` : "미정"}
              </div>
              <div>
                분양 날짜・
                {adoptionData?.adoptionDate
                  ? format(adoptionData.adoptionDate, "yyyy-MM-dd")
                  : "미정"}
              </div>
            </div>
          }
        />
      );
    },
  },
  {
    accessorKey: "name",
    header: TABLE_HEADER.name,

    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      return <TooltipText title="이름" text={name} />;
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
    accessorKey: "growth",
    header: TABLE_HEADER.growth,
    cell: ({ row }) => {
      const growth = row.getValue("growth") as PetDtoGrowth;
      return <div>{GROWTH_KOREAN_INFO[growth]}</div>;
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
    accessorKey: "father",
    header: TABLE_HEADER.father,
    cell: ({ row }) => {
      if (!row.original.father) {
        return <span>-</span>;
      }

      if (
        "hiddenStatus" in row.original.father &&
        row.original.father?.hiddenStatus === PetHiddenStatusDtoHiddenStatus.SECRET
      ) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </TooltipTrigger>
            <TooltipContent>브리더에 의해 비공개 처리된 펫입니다</TooltipContent>
          </Tooltip>
        );
      }

      const father = row.original.father as PetParentDto;
      const status = father?.status ?? "approved";
      return (
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
      );
    },
  },
  {
    accessorKey: "mother",
    header: TABLE_HEADER.mother,
    cell: ({ row }) => {
      if (!row.original.mother) {
        return <span>-</span>;
      }

      if (
        "hiddenStatus" in row.original.mother &&
        row.original.mother?.hiddenStatus === PetHiddenStatusDtoHiddenStatus.SECRET
      ) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </TooltipTrigger>
            <TooltipContent>브리더에 의해 비공개 처리된 펫입니다</TooltipContent>
          </Tooltip>
        );
      }

      const mother = row.original.mother as PetParentDto;
      const status = mother?.status ?? "approved";
      return (
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
      );
    },
  },
  {
    accessorKey: "desc",
    header: TABLE_HEADER.desc,
    cell: ({ row }) => {
      const desc = row.getValue("desc") as string;
      return <TooltipText title="설명" description="펫의 설명입니다." text={desc} />;
    },
  },
  // {
  //   accessorKey: "foods",
  //   header: TABLE_HEADER.foods,
  //   cell: ({ row }) => {
  //     const foods = row.getValue("foods") as string[];

  //     return (
  //       <div className="flex flex-wrap gap-1">
  //         {foods?.map((food) => (
  //           <Badge
  //             key={food}
  //             className={`font-bold ${FOOD_BADGE_COLORS[food]} ${FOOD_BADGE_TEXT_COLORS[food]}`}
  //           >
  //             {food}
  //           </Badge>
  //         ))}
  //       </div>
  //     );
  //   },
  // },
  // {
  //   id: "actions",
  //   enableHiding: false,
  //   cell: ({ row }) => {
  //     const pet = row.original;

  //     return (
  //       <DropdownMenu>
  //         <DropdownMenuTrigger asChild>
  //           <Button variant="ghost" className="h-8 w-8 p-0">
  //             <span className="sr-only">Open menu</span>
  //             <MoreHorizontal />
  //           </Button>
  //         </DropdownMenuTrigger>
  //         <DropdownMenuContent align="end">
  //           <DropdownMenuLabel>Actions</DropdownMenuLabel>
  //           <DropdownMenuItem onClick={() => navigator.clipboard.writeText(pet.petId.toString())}>
  //             복사
  //           </DropdownMenuItem>
  //           <DropdownMenuSeparator />
  //           <DropdownMenuItem>예시</DropdownMenuItem>
  //         </DropdownMenuContent>
  //       </DropdownMenu>
  //     );
  //   },
  // },
];
