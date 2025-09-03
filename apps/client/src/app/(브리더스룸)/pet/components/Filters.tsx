"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table } from "@tanstack/react-table";
import { ChevronDown, Search } from "lucide-react";
import { TABLE_HEADER } from "../../constants";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { BrPetControllerFindAllParams, PetDto } from "@repo/api-client";
import { useFilterStore } from "../../store/filter";

interface FiltersProps<TData> {
  table: Table<TData>;
}

export function Filters<TData>({ table }: FiltersProps<TData>) {
  const [filters, setFilters] = useState<Partial<BrPetControllerFindAllParams>>({});
  const { columnFilters, setColumnFilters, searchFilters, setSearchFilters } = useFilterStore();
  const handleSearch = () => {
    setSearchFilters(filters);
  };

  const hasActiveFilters = Object.entries(searchFilters).some(
    ([key, value]) => value !== undefined && value !== "" && value !== null && key !== "keyword",
  );

  const handleResetFilters = () => {
    setSearchFilters({});
    setFilters({});
  };

  useEffect(() => {
    if (columnFilters) return;

    setColumnFilters(
      table.getAllColumns().reduce(
        (acc, column) => {
          acc[column.id as keyof PetDto] = column.getIsVisible();
          return acc;
        },
        {} as Partial<Record<keyof PetDto, boolean>>,
      ),
    );
  }, [table, setColumnFilters, columnFilters]);

  return (
    <div className="flex items-center gap-2 py-2">
      {/* 검색 */}
      <div className="flex items-center gap-2">
        {/* 간단한 키워드 검색 */}
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="펫 이름으로 검색"
            value={filters.keyword || ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
            className="pl-10"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
        </div>
        <Button variant="outline" size="icon" onClick={handleSearch}>
          검색
        </Button>
      </div>

      <Button
        disabled={!hasActiveFilters}
        variant="outline"
        className="relative bg-gray-200"
        onClick={handleResetFilters}
      >
        필터 초기화
        {hasActiveFilters && (
          <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500" />
        )}
      </Button>

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
                checked={columnFilters?.[column.id as keyof PetDto]}
                onCheckedChange={(value) => {
                  setColumnFilters({
                    [column.id]: !!value,
                  });
                }}
                onSelect={(e) => e.preventDefault()}
              >
                {TABLE_HEADER[column.id as keyof typeof TABLE_HEADER]}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
