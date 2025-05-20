import { petControllerFindOne } from "@repo/api-client";
import PetDetail from "./petDetail";

interface PetDetailPageProps {
  params: {
    petId: string;
  };
}

async function PetDetailPage({ params }: PetDetailPageProps) {
  const pet = await petControllerFindOne(params.petId);

  return <PetDetail pet={pet.data} />;
}

export default PetDetailPage;
