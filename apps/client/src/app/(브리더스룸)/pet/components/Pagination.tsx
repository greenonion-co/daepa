import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { ChevronLeft } from "lucide-react";

interface PaginationProps<TData> {
  table: Table<TData>;
  pagination: {
    page: number;
    setPage: (page: number) => void;
    totalPage?: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}

export function Pagination<TData>({ table, pagination }: PaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="text-muted-foreground text-sm">
        <span className="font-bold text-blue-500">
          {table.getFilteredSelectedRowModel().rows.length}
        </span>{" "}
        / <span className="font-bold">{table.getFilteredRowModel().rows.length}</span>
      </div>
      <div className="flex items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => pagination.setPage(pagination.page - 1)}
          disabled={!pagination.hasPreviousPage}
        >
          <ChevronLeft />
        </Button>
        <span className="mx-2 font-semibold">{pagination.page}</span>
        <span>/</span>
        <span className="mx-2">{pagination.totalPage}</span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => pagination.setPage(pagination.page + 1)}
          disabled={!pagination.hasNextPage}
        >
          <ChevronRight />
        </Button>
      </div>
      <div />
    </div>
  );
}
