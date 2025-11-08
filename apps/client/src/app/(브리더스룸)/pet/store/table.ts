import { create } from "zustand";
import { SortingState } from "@tanstack/react-table";

interface TableState<TData> {
  // 테이블 상태
  sorting: SortingState;
  rowSelection: Record<string, boolean>;

  // 데이터
  data: TData[];

  // 액션
  setSorting: (updater: SortingState | ((prev: SortingState) => SortingState)) => void;
  setRowSelection: (
    updater: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>),
  ) => void;
  setData: (data: TData[]) => void;
}

const createTableStore = <TData>() =>
  create<TableState<TData>>((set) => ({
    // 초기 상태
    sorting: [],
    rowSelection: {},
    data: [],

    // 액션
    setSorting: (updater) =>
      set((state) => ({
        sorting: typeof updater === "function" ? updater(state.sorting) : updater,
      })),
    setRowSelection: (updater) =>
      set((state) => ({
        rowSelection: typeof updater === "function" ? updater(state.rowSelection) : updater,
      })),
    setData: (data) => set({ data }),
  }));

const useTableStore = createTableStore();

export default useTableStore;
