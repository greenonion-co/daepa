import { columns } from "./components/columns";
import DataTable from "./components/DataTable";
import { petControllerFindAll } from "@repo/api-client";

export default async function PetPage() {
  const { data } = await petControllerFindAll();

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data.data} />
    </div>
  );
}
