import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { ChevronLeft } from "lucide-react";

interface PaginationProps<TData> {
  table: Table<TData>;
}

export function Pagination<TData>({ table }: PaginationProps<TData>) {
  return (
    <div className="flex items-center py-2">
      <div className="text-muted-foreground text-sm">
        <span className="font-bold text-blue-500">
          {table.getFilteredSelectedRowModel().rows.length}
        </span>{" "}
        / <span className="font-bold">{table.getFilteredRowModel().rows.length}</span>
      </div>
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
