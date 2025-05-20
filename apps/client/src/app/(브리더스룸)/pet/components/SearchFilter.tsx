import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Input } from "@/components/ui/input";

import { Table } from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import { TABLE_HEADER } from "../../constants";

interface SearchFilterProps<TData> {
  table: Table<TData>;
}

export function SearchFilter<TData>({ table }: SearchFilterProps<TData>) {
  return (
    <div className="flex items-center gap-2 py-2">
      <Input
        placeholder="이름으로 검색(페이지 내에서만 검색됨. 수정 필요)"
        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
        onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
        className="max-w-sm"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            필터 <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {TABLE_HEADER[column.id as keyof typeof TABLE_HEADER]}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
