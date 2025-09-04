"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Column } from "@tanstack/react-table";

const TableHeaderSelect = <TData,>({
  column,
  title,
  items,
  searchFilters,
  setSearchFilters,
  renderItem = (item: string | number) => item.toString(),
}: {
  column: Column<TData, unknown>;
  title: string;
  items: Array<string | number>;
  searchFilters: Record<string, unknown>;
  setSearchFilters: (filters: Record<string, unknown>) => void;
  renderItem?: (item: string | number) => string;
}) => {
  const columnId = column.id.split("_")[1] ?? column.id;

  const handleValueChange = (value: string) => {
    if (value === "all") {
      setSearchFilters({
        ...searchFilters,
        [columnId]: undefined,
      });
      return;
    }

    setSearchFilters({
      ...searchFilters,
      [columnId]: value,
    });
  };

  return (
    <div className="mb-1 mt-1 flex flex-col items-center">
      {title}
      <Select
        value={(searchFilters[columnId] as string | number | undefined)?.toString() ?? "all"}
        onValueChange={handleValueChange}
      >
        <SelectTrigger size="sm" className="mt-1">
          <SelectValue placeholder="전체" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          {items.map((item) => (
            <SelectItem key={item} value={item.toString()}>
              {renderItem(item)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TableHeaderSelect;
