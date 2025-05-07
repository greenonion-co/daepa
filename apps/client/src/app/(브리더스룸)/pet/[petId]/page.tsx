import { petApi } from "../api/pet";
import PetDetail from "./petDetail";

interface PetDetailPageProps {
  params: {
    petId: string;
  };
}

async function PetDetailPage({ params }: PetDetailPageProps) {
  const pet = await petApi.getDetail(params.petId);

  return <PetDetail pet={pet} />;
}

export default PetDetailPage;
