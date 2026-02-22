"use client";

import { ColumnDef } from "@tanstack/react-table";
import BadgeList from "../../components/BadgeList";
import ParentStatusIcon from "../../components/ParentStatusIcon";
import { GROWTH_KOREAN_INFO, TABLE_HEADER } from "../../constants";
import {
  PetDto,
  PetDtoGrowth,
  PetParentDto,
  PetHiddenStatusDtoHiddenStatus,
  AdoptionDto,
  UpdateAdoptionDtoStatus,
} from "@repo/api-client";
import LinkButton from "../../components/LinkButton";
import { DateTime } from "luxon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import TooltipText from "../../components/TooltipText";
import AdoptionStatusBadge from "../../components/AdoptionStatusBadge";
import DeletedPetName from "../../components/DeletedPetName";
import HiddenPetBadge from "@/components/common/HiddenPetBadge";
import { Popover, PopoverTrigger, PopoverContent, PopoverClose } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type PreviewOverride = { petId: string; name?: string; status?: string } | null;

export type TableMeta = {
  setPreviewOverride?: (info: PreviewOverride) => void;
  setPreviewSuppressed?: (suppressed: boolean) => void;
  togglePublic?: (petId: string, currentIsPublic: boolean) => void;
  changeAdoptionStatus?: (
    petId: string,
    currentAdoption: AdoptionDto | null | undefined,
    newStatus: UpdateAdoptionDtoStatus | null,
  ) => void;
  changeGrowth?: (petId: string, currentGrowth: PetDtoGrowth, newGrowth: PetDtoGrowth) => void;
};

export const columns: ColumnDef<PetDto>[] = [
  {
    accessorKey: "isPublic",
    size: 40,
    header: () => {
      return (
        <TooltipText
          text="공개"
          title="공개 여부"
          description="개체의 공개 여부를 나타냅니다."
          content="비공개 개체는 다른 브리더에게 공개되지 않습니다."
        />
      );
    },
    cell: ({ cell, row, table }) => {
      const isPublic = cell.getValue() as boolean;
      const togglePublic = (table.options.meta as TableMeta)?.togglePublic;
      return (
        <div className="flex justify-center">
          <button
            type="button"
            role="switch"
            aria-checked={isPublic}
            aria-label={`${row.original.name} 공개 여부`}
            onClick={(e) => {
              e.stopPropagation();
              togglePublic?.(row.original.petId, isPublic);
            }}
            className={`flex h-[14px] w-[26px] shrink-0 cursor-pointer items-center rounded-full px-[2px] transition-colors ${
              isPublic
                ? "justify-end bg-[#35B0AB] dark:bg-[#2B9A94]"
                : "justify-start bg-[#D5D5D4] dark:bg-[#3F3F3F]"
            }`}
          >
            <div className="h-[10px] w-[10px] rounded-full bg-white shadow-sm" />
          </button>
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
    cell: ({ cell, row, table }) => {
      const adoptionData = cell.getValue() as AdoptionDto;
      const adoptionStatus = adoptionData?.status ?? null;
      const meta = table.options.meta as TableMeta;
      const setSuppressed = meta?.setPreviewSuppressed;
      const changeAdoptionStatus = meta?.changeAdoptionStatus;

      const statusOptions: { value: UpdateAdoptionDtoStatus | null; label: string }[] = [
        { value: null, label: "미설정" },
        { value: UpdateAdoptionDtoStatus.NFS, label: "NFS" },
        { value: UpdateAdoptionDtoStatus.ON_SALE, label: "분양중" },
        { value: UpdateAdoptionDtoStatus.ON_RESERVATION, label: "예약중" },
      ];

      return (
        <div onMouseEnter={() => setSuppressed?.(true)} onMouseLeave={() => setSuppressed?.(false)}>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="cursor-pointer rounded-full transition-opacity hover:opacity-70"
              >
                {adoptionStatus ? (
                  <AdoptionStatusBadge status={adoptionStatus} />
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] leading-none font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                    미설정
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto min-w-[120px] rounded-xl border p-1 shadow-lg"
              align="start"
              sideOffset={4}
            >
              <div className="flex flex-col">
                {statusOptions.map((option) => (
                  <PopoverClose key={option.label} asChild>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (option.value !== adoptionStatus) {
                          changeAdoptionStatus?.(
                            row.original.petId,
                            adoptionData ?? null,
                            option.value,
                          );
                        }
                      }}
                      className={cn(
                        "flex items-center rounded-md px-1 py-1.5 text-[12px] font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700",
                        option.value === adoptionStatus && "bg-gray-100 dark:bg-gray-700",
                      )}
                    >
                      {option.value ? (
                        <AdoptionStatusBadge status={option.value} />
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] leading-none font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                          미설정
                        </span>
                      )}
                    </button>
                  </PopoverClose>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: TABLE_HEADER.name,
    cell: ({ row, table }) => {
      const name = row.getValue("name") as string;
      const sex = row.original.sex;
      const setSuppressed = (table.options.meta as TableMeta)?.setPreviewSuppressed;
      const dotColor =
        sex === "M"
          ? "bg-[#2383E2] dark:bg-[#529CCA]"
          : sex === "F"
            ? "bg-[#E03E3E] dark:bg-[#FF7369]"
            : "bg-gray-300";
      return (
        <div
          className="flex max-w-[90px] items-center gap-1.5 break-words"
          onMouseEnter={() => setSuppressed?.(true)}
          onMouseLeave={() => setSuppressed?.(false)}
        >
          <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
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
    accessorKey: "growth",
    size: 60,
    header: TABLE_HEADER.growth,
    cell: ({ row, table }) => {
      const growth = row.getValue("growth") as PetDtoGrowth;
      const meta = table.options.meta as TableMeta;
      const setSuppressed = meta?.setPreviewSuppressed;
      const changeGrowth = meta?.changeGrowth;

      const growthColorMap: Record<string, string> = {
        BABY: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        JUVENILE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        PRE_ADULT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        ADULT: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      };

      const growthOptions: { value: PetDtoGrowth; label: string }[] = [
        { value: PetDtoGrowth.BABY, label: "베이비" },
        { value: PetDtoGrowth.JUVENILE, label: "아성체" },
        { value: PetDtoGrowth.PRE_ADULT, label: "준성체" },
        { value: PetDtoGrowth.ADULT, label: "성체" },
      ];

      const currentLabel = GROWTH_KOREAN_INFO[growth];

      return (
        <div onMouseEnter={() => setSuppressed?.(true)} onMouseLeave={() => setSuppressed?.(false)}>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="cursor-pointer rounded-full transition-opacity hover:opacity-70"
              >
                {currentLabel ? (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] leading-none font-medium",
                      growthColorMap[growth],
                    )}
                  >
                    {currentLabel}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] leading-none font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                    미설정
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto min-w-[100px] rounded-xl border p-1 shadow-lg"
              align="start"
              sideOffset={4}
            >
              <div className="flex flex-col">
                {growthOptions.map((option) => (
                  <PopoverClose key={option.value} asChild>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (option.value !== growth) {
                          changeGrowth?.(row.original.petId, growth, option.value);
                        }
                      }}
                      className={cn(
                        "flex items-center rounded-md px-1 py-1.5 text-[12px] font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700",
                        option.value === growth && "bg-gray-100 dark:bg-gray-700",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] leading-none font-medium",
                          growthColorMap[option.value],
                        )}
                      >
                        {option.label}
                      </span>
                    </button>
                  </PopoverClose>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      );
    },
  },
  {
    accessorKey: "weight",
    header: TABLE_HEADER.weight,
    size: 60,
    cell: ({ row }) => (
      <div className="text-[12px]">{row.original.weight ? `${row.original.weight}g` : null}</div>
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
    cell: ({ row, table }) => {
      const meta = table.options.meta as TableMeta;
      const setSuppressed = meta?.setPreviewSuppressed;
      const setPreview = meta?.setPreviewOverride;

      if (!row.original.father) {
        return null;
      }

      if (
        "hiddenStatus" in row.original.father &&
        row.original.father?.hiddenStatus === PetHiddenStatusDtoHiddenStatus.SECRET
      ) {
        return (
          <span
            onMouseEnter={() => setSuppressed?.(true)}
            onMouseLeave={() => setSuppressed?.(false)}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <HiddenPetBadge />
              </TooltipTrigger>
              <TooltipContent>소유자에 의해 비공개 처리된 개체입니다</TooltipContent>
            </Tooltip>
          </span>
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
        <span
          onMouseEnter={() => setPreview?.({ petId: father.petId, name: father.name, status })}
          onMouseLeave={() => setPreview?.(null)}
        >
          <LinkButton
            href={`/pet/${father.petId}`}
            label={truncatedName}
            icon={<ParentStatusIcon status={status} />}
            className={
              status === "approved"
                ? "text-[#0F7B6C] hover:decoration-[#0F7B6C] dark:text-[#4DAB9A] dark:hover:decoration-[#4DAB9A]"
                : status === "pending"
                  ? "text-[#D9730D] hover:decoration-[#D9730D] dark:text-[#FFA344] dark:hover:decoration-[#FFA344]"
                  : undefined
            }
          />
        </span>
      );
    },
  },
  {
    accessorKey: "mother",
    header: TABLE_HEADER.mother,
    cell: ({ row, table }) => {
      const meta = table.options.meta as TableMeta;
      const setSuppressed = meta?.setPreviewSuppressed;
      const setPreview = meta?.setPreviewOverride;

      if (!row.original.mother) {
        return null;
      }

      if (
        "hiddenStatus" in row.original.mother &&
        row.original.mother?.hiddenStatus === PetHiddenStatusDtoHiddenStatus.SECRET
      ) {
        return (
          <span
            onMouseEnter={() => setSuppressed?.(true)}
            onMouseLeave={() => setSuppressed?.(false)}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <HiddenPetBadge />
              </TooltipTrigger>
              <TooltipContent>소유자에 의해 비공개 처리된 개체입니다</TooltipContent>
            </Tooltip>
          </span>
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
        <span
          onMouseEnter={() => setPreview?.({ petId: mother.petId, name: mother.name, status })}
          onMouseLeave={() => setPreview?.(null)}
        >
          <LinkButton
            href={`/pet/${mother.petId}`}
            label={truncatedName}
            icon={<ParentStatusIcon status={status} />}
            className={
              status === "approved"
                ? "text-[#0F7B6C] hover:decoration-[#0F7B6C] dark:text-[#4DAB9A] dark:hover:decoration-[#4DAB9A]"
                : status === "pending"
                  ? "text-[#D9730D] hover:decoration-[#D9730D] dark:text-[#FFA344] dark:hover:decoration-[#FFA344]"
                  : undefined
            }
          />
        </span>
      );
    },
  },
  {
    accessorKey: "desc",
    header: TABLE_HEADER.desc,
    cell: ({ row, table }) => {
      const desc = row.getValue("desc") as string;
      const setSuppressed = (table.options.meta as TableMeta)?.setPreviewSuppressed;
      return (
        <span
          onMouseEnter={() => setSuppressed?.(true)}
          onMouseLeave={() => setSuppressed?.(false)}
        >
          <TooltipText title="설명" description="개체의 설명입니다." text={desc} />
        </span>
      );
    },
  },
];
