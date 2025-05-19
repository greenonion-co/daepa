import { columns } from "./components/columns";
import DataTable from "./components/DataTable";
import { petControllerFindAll, PetDto } from "@repo/api-client";

async function getData(): Promise<PetDto[]> {
  const response = await petControllerFindAll();
  return response.data;
}

export default async function PetPage() {
  const { data } = await getData();

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
