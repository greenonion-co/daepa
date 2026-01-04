"use client";

import { ColumnDef } from "@tanstack/react-table";
import { SPECIES_KOREAN_ALIAS_INFO, SPECIES_KOREAN_INFO, TABLE_HEADER } from "../../../constants";
import { DeletedPetDto, PetDtoSpecies } from "@repo/api-client";
import { DateTime } from "luxon";
import TooltipText from "../../../components/TooltipText";
import { RestorePetButton } from "./RestorePetButton";

export const columns: ColumnDef<DeletedPetDto>[] = [
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
    accessorKey: "name",
    header: TABLE_HEADER.pet_name,
    cell: ({ row }) => {
      const name = row.getValue("name") as string;

      return <div className="text-gray-700 dark:text-gray-300">{name}</div>;
    },
  },
  {
    accessorKey: "hatchingDate",
    header: TABLE_HEADER.hatchingDate,
    cell: ({ cell }) => {
      const hatchingDate = cell.getValue();
      if (!hatchingDate) return <div className="text-center">-</div>;

      const raw = hatchingDate as string | Date;
      const d = typeof raw === "string" ? DateTime.fromISO(raw) : DateTime.fromJSDate(raw);
      return <div className="text-center">{d.isValid ? d.toFormat("yyyy-MM-dd") : "-"}</div>;
    },
  },
  {
    accessorKey: "deletedAt",
    header: "삭제 일시",
    cell: ({ cell }) => {
      const deletedAt = cell.getValue();
      if (!deletedAt) return <div className="text-center">-</div>;

      const raw = deletedAt as string | Date;
      const d = typeof raw === "string" ? DateTime.fromISO(raw) : DateTime.fromJSDate(raw);
      return (
        <div className="text-center text-sm text-gray-500 dark:text-gray-300">
          {d.isValid ? d.toFormat("yyyy-MM-dd HH:mm") : "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "deleteReason",
    header: "삭제 사유",
    cell: ({ cell }) => {
      const reason = cell.getValue() as string;
      if (!reason) return <div className="text-center text-gray-400">-</div>;

      return (
        <TooltipText
          title="삭제 사유"
          text={reason.length > 20 ? `${reason.slice(0, 20)}...` : reason}
          content={reason}
        />
      );
    },
  },
  {
    id: "actions",
    header: "작업",
    cell: ({ row }) => {
      return <RestorePetButton petId={row.original.petId} />;
    },
  },
];
