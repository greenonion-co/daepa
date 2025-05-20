"use client";
import { useQuery } from "@tanstack/react-query";
import { columns } from "./components/columns";
import DataTable from "./components/DataTable";
import { brPetControllerFindAll } from "@repo/api-client";
import { useState } from "react";

export default function PetPage() {
  const [page, setPage] = useState(1);
  const itemPerPage = 10; // 페이지당 항목 수

  const { data, isLoading } = useQuery({
    queryKey: ["pets", page],
    queryFn: () =>
      brPetControllerFindAll({
        page,
        itemPerPage,
        order: "ASC",
      }),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-10">
      <DataTable
        columns={columns}
        data={data?.data.data || []}
        pagination={{
          page,
          setPage,
          ...data?.data.meta,
        }}
      />
    </div>
  );
}
