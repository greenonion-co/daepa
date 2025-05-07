import { Pet } from "@/types/pet";
import { columns } from "./components/columns";
import DataTable from "./components/DataTable";
import { petApi } from "./api/pet";

async function getData(): Promise<Pet[]> {
  const response = await petApi.getAll();
  return response;
}

export default async function DemoPage() {
  const data = await getData();

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
