import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Column } from "@tanstack/react-table";
import useSearchStore from "../pet/store/search";

interface TableHeaderSelectProps<TData> {
  column: Column<TData, unknown>;
  title: string;
  items: string[] | number[];
  renderItem?: (item: string | number) => string;
}

const TableHeaderSelect = <TData,>({
  column,
  title,
  items,
  renderItem = (item: string | number) => item.toString(),
}: TableHeaderSelectProps<TData>) => {
  const { searchFilters, setSearchFilters } = useSearchStore();
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
        value={searchFilters[columnId]?.toString() ?? "all"}
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
