"use client";

import { Lock, LockOpen } from "lucide-react";
import { getSexIcon } from "@/lib/sex-icon";
import { ColumnDef } from "@tanstack/react-table";
import { CircleSmall } from "lucide-react";
import BadgeList from "../../components/BadgeList";
import {
  GROWTH_KOREAN_INFO,
  SALE_STATUS_KOREAN_INFO,
  STATUS_MAP,
  TABLE_HEADER,
} from "../../constants";
import {
  PetDto,
  PetDtoGrowth,
  PetParentDto,
  PetHiddenStatusDtoHiddenStatus,
  AdoptionDto,
  PetAdoptionDtoStatus,
} from "@repo/api-client";
import LinkButton from "../../components/LinkButton";
import { DateTime } from "luxon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import TooltipText from "../../components/TooltipText";
import AdoptionStatusBadge from "../../components/AdoptionStatusBadge";
import DeletedPetName from "../../components/DeletedPetName";
import HiddenPetBadge from "@/components/common/HiddenPetBadge";

export const columns: ColumnDef<PetDto>[] = [
  {
    accessorKey: "isPublic",
    size: 40,
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
            <LockOpen className="h-4 w-4 stroke-3 text-blue-500 dark:text-neutral-200" />
          ) : (
            <Lock className="h-4 w-4 stroke-3 text-yellow-500 dark:text-yellow-400" />
          )}
        </div>
      );
    },
  },
  // {
  //   accessorKey: "species",
  //   header: TABLE_HEADER.species,
  //   cell: ({ row }) => {
  //     const species = row.getValue("species") as PetDtoSpecies;
  //     return (
  //       <TooltipText
  //         title="종"
  //         text={SPECIES_KOREAN_ALIAS_INFO[species]}
  //         content={SPECIES_KOREAN_INFO[species]}
  //       />
  //     );
  //   },
  // },
  {
    accessorKey: "adoption",
    size: 60,
    header: TABLE_HEADER.adoption_status,
    cell: ({ cell }) => {
      const adoptionData = cell.getValue() as AdoptionDto;
      const adoptionStatus = adoptionData?.status;

      if (!adoptionStatus || adoptionStatus === PetAdoptionDtoStatus.NONE) {
        return null;
      }

      const adoptionLabel = SALE_STATUS_KOREAN_INFO[adoptionStatus];
      const badge = <AdoptionStatusBadge status={adoptionStatus} />;

      // NFS는 툴팁 없음
      if (adoptionStatus === PetAdoptionDtoStatus.NFS) return badge;

      return (
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent className="max-w-[300px] min-w-[200px] rounded-2xl border border-gray-300 bg-white p-5 font-[500] shadow-lg dark:border-gray-600 dark:bg-gray-700">
            <div className="text-[16px] font-[600] text-gray-800 dark:text-gray-100">
              {adoptionLabel}
            </div>
            {adoptionData?.memo && (
              <div className="pb-2 text-[12px] text-gray-500 dark:text-gray-400">
                {adoptionData.memo}
              </div>
            )}
            <div className="text-[14px] break-keep whitespace-pre-wrap text-gray-800 dark:text-gray-200">
              <div className="capitalize">
                <div>
                  가격・
                  {adoptionData?.price ? `${adoptionData?.price?.toLocaleString()}원` : "미정"}
                </div>
                <div>
                  분양 날짜・
                  {adoptionData?.adoptionDate
                    ? (() => {
                        const d = DateTime.fromISO(adoptionData.adoptionDate);
                        return d.isValid ? d.toFormat("yy년 M월 d일") : "미정";
                      })()
                    : "미정"}
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: "name",
    header: TABLE_HEADER.name,
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      return (
        <div className="max-w-[70px] break-words">
          <TooltipText title="이름" text={name} displayTextLength={10} className="font-semibold" />
        </div>
      );
    },
  },
  {
    accessorKey: "morphs",
    size: 160,
    header: TABLE_HEADER.morphs,
    cell: ({ row }) =>
      row.original.morphs && row.original.morphs.length > 0 ? (
        <BadgeList variant={"outline"} items={row.original.morphs} />
      ) : null,
  },
  {
    accessorKey: "traits",
    size: 160,
    header: TABLE_HEADER.traits,
    cell: ({ row }) =>
      row.original.traits && row.original.traits.length > 0 ? (
        <BadgeList
          items={row.original.traits}
          variant="secondary"
          badgeClassName="bg-white text-black dark:bg-gray-700 dark:text-gray-200"
        />
      ) : (
        <span className="text-gray-400">-</span>
      ),
  },
  {
    accessorKey: "sex",
    size: 60,
    header: TABLE_HEADER.sex,
    cell: ({ row }) => getSexIcon(row.getValue("sex") as string, { size: "sm" }),
  },
  {
    accessorKey: "growth",
    size: 60,
    header: TABLE_HEADER.growth,
    cell: ({ row }) => {
      const growth = row.getValue("growth") as PetDtoGrowth;
      return <div>{GROWTH_KOREAN_INFO[growth]}</div>;
    },
  },
  {
    accessorKey: "weight",
    header: TABLE_HEADER.weight,
    size: 60,
    cell: ({ row }) => (
      <div className="capitalize">{row.original.weight ? row.getValue("weight") + "g" : null}</div>
    ),
  },
  {
    accessorKey: "hatchingDate",
    size: 80,
    header: TABLE_HEADER.hatchingDate,
    cell: ({ row }) => {
      const hatchingDateRaw = row.getValue("hatchingDate") as string | undefined;
      if (!hatchingDateRaw) return null;
      const hatchingDate = DateTime.fromISO(hatchingDateRaw);
      return (
        <div className="capitalize">
          {hatchingDate.isValid ? hatchingDate.toFormat("yy.MM.dd") : null}
        </div>
      );
    },
  },
  {
    accessorKey: "father",
    header: TABLE_HEADER.father,
    cell: ({ row }) => {
      if (!row.original.father) {
        return null;
      }

      if (
        "hiddenStatus" in row.original.father &&
        row.original.father?.hiddenStatus === PetHiddenStatusDtoHiddenStatus.SECRET
      ) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <HiddenPetBadge />
            </TooltipTrigger>
            <TooltipContent>소유자에 의해 비공개 처리된 개체입니다</TooltipContent>
          </Tooltip>
        );
      }

      const father = row.original.father as PetParentDto;
      const status = father?.status;
      const isDeleted = father.isDeleted;

      if (isDeleted) {
        return <DeletedPetName name={father.name} maxLength={6} />;
      }

      const truncatedName =
        father.name && father.name.length > 6
          ? `${father.name.slice(0, 6)}...`
          : (father.name ?? "");
      return (
        <LinkButton
          href={`/pet/${father.petId}`}
          label={truncatedName}
          tooltip={
            (status === "approved" && "혈통 인증 완료") ||
            (status === "pending" && "혈통 인증 대기 중") ||
            ""
          }
          icon={<CircleSmall className={`h-3 w-3 ${STATUS_MAP[status].icon}`} />}
        />
      );
    },
  },
  {
    accessorKey: "mother",
    header: TABLE_HEADER.mother,
    cell: ({ row }) => {
      if (!row.original.mother) {
        return null;
      }

      if (
        "hiddenStatus" in row.original.mother &&
        row.original.mother?.hiddenStatus === PetHiddenStatusDtoHiddenStatus.SECRET
      ) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <HiddenPetBadge />
            </TooltipTrigger>
            <TooltipContent>소유자에 의해 비공개 처리된 개체입니다</TooltipContent>
          </Tooltip>
        );
      }

      const mother = row.original.mother as PetParentDto;
      const status = mother?.status;
      const isDeleted = mother.isDeleted;

      if (isDeleted) {
        return <DeletedPetName name={mother.name} maxLength={6} />;
      }

      const truncatedName =
        mother.name && mother.name.length > 6
          ? `${mother.name.slice(0, 6)}...`
          : (mother.name ?? "");
      return (
        <LinkButton
          href={`/pet/${mother.petId}`}
          label={truncatedName}
          tooltip={
            (status === "approved" && "혈통 인증 완료") ||
            (status === "pending" && "혈통 인증 대기 중") ||
            ""
          }
          icon={<CircleSmall className={`h-3 w-3 ${STATUS_MAP[status].icon}`} />}
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
];
