import BreedingInfoContent from "./BreedingInfoContent";
import { fetchPet } from "@/app/(브리더스룸)/pet/[petId]/page";

interface BreedingInfoProps {
  petId: string;
  ownerId: string;
}

export default async function BreedingInfo({ petId, ownerId }: BreedingInfoProps) {
  const pet = await fetchPet(petId);

  return <BreedingInfoContent petId={petId} ownerId={ownerId} initialPet={pet} />;
}
