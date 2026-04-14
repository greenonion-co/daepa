"use client";

import { useState, useCallback } from "react";
import useTableStore from "../../pet/store/table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { overlay } from "overlay-kit";
import Loading from "@/components/common/Loading";
import AdoptionReceiptModal from "./AdoptionReceiptModal";
import { columns } from "./adoption_columns";
import { AdoptionHistoryDto } from "@repo/api-client";
import { useIsMobile } from "@/hooks/useMobile";
import { useDebouncedHover } from "@/hooks/useDebouncedHover";
import PetHoverPreview from "../../pet/components/PetHoverPreview";

interface AdoptionTableViewProps {
  data: AdoptionHistoryDto[];
  hasMore?: boolean;
  isFetchingMore?: boolean;
  loaderRefAction?: (node?: Element | null) => void;
}

export default function AdoptionTableView({
  data,
  hasMore,
  isFetchingMore,
  loaderRefAction,
}: AdoptionTableViewProps) {
  const { sorting, rowSelection, setSorting, setRowSelection } = useTableStore();
  const isMobile = useIsMobile();

  const [debouncedHoveredPetId, hoverEnter, hoverLeave] = useDebouncedHover<string>();
  const [previewOverridePetId, setPreviewOverridePetId] = useState<string | null>(null);
  const [previewSuppressed, setPreviewSuppressed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      const cell = (e.target as HTMLElement).closest("td[data-column-id]");
      if (cell?.getAttribute("data-column-id") === "memo") {
        hoverLeave();
      } else {
        const row = (e.target as HTMLElement).closest("tr[data-pet-id]");
        const petId = row?.getAttribute("data-pet-id");
        if (petId) hoverEnter(petId);
      }
    },
    [hoverEnter, hoverLeave],
  );

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
    meta: {
      setPreviewOverridePetId,
      setPreviewSuppressed,
    },
  });

  return (
    <div className="relative" onMouseMove={!isMobile ? handleMouseMove : undefined}>
      <div className="rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead className="font-[400] text-gray-600" key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              <>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    data-pet-id={row.original.petId}
                    className={cn(
                      "cursor-pointer",
                      "hover:bg-purple-50 dark:bg-[#18171C] dark:hover:bg-purple-900/30",
                    )}
                    onMouseEnter={!isMobile ? () => hoverEnter(row.original.petId) : undefined}
                    onMouseLeave={!isMobile ? hoverLeave : undefined}
                    onClick={() => {
                      overlay.open(({ isOpen, close }) => (
                        <AdoptionReceiptModal
                          isOpen={isOpen}
                          onClose={close}
                          adoption={row.original}
                        />
                      ));
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2" data-column-id={cell.column.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {hasMore && (
                  <TableRow ref={loaderRefAction}>
                    <TableCell colSpan={columns.length} className="h-20 text-center">
                      {isFetchingMore && <Loading />}
                    </TableCell>
                  </TableRow>
                )}
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      분양 정보가 없습니다.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!previewSuppressed && (previewOverridePetId || debouncedHoveredPetId) && (
        <PetHoverPreview
          petId={(previewOverridePetId || debouncedHoveredPetId)!}
          mousePos={mousePos}
        />
      )}
    </div>
  );
}
