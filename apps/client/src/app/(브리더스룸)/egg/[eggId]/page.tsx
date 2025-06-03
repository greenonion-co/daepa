import { eggControllerFindOne } from "@repo/api-client";
import { notFound } from "next/navigation";
import EggDetail from "../ EggDetail";
import { formatDateToYYYYMMDDString } from "@/lib/utils";
interface PetDetailPageProps {
  params: {
    eggId: string;
  };
}

async function PetDetailPage({ params }: PetDetailPageProps) {
  const pet = await eggControllerFindOne(params.eggId);

  if (!pet.data) {
    notFound();
  }

  const formattedData = {
    ...pet.data,
    layingDate: formatDateToYYYYMMDDString(pet.data.layingDate),
  };

  return <EggDetail egg={formattedData} />;
}

export default PetDetailPage;
