import { columns } from "./components/columns";
import DataTable from "./components/DataTable";
import { GetAllPetResponse, petApi } from "./api/pet";

async function getData(): Promise<GetAllPetResponse> {
  const response = await petApi.getAll();
  return response;
}

export default async function PetPage() {
  const { data } = await getData();

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
