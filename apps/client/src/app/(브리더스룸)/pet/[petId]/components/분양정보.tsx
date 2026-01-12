import { PetDto } from "@repo/api-client";
import { fetchAdoption } from "../data";
import AdoptionInfoContent from "./AdoptionInfoContent";

interface AdoptionInfoProps {
  pet: PetDto;
}

export default async function AdoptionInfo({ pet }: AdoptionInfoProps) {
  const adoption = await fetchAdoption(pet.petId);

  return (
    <AdoptionInfoContent
      petId={pet.petId}
      ownerId={pet.owner.userId ?? ""}
      initialAdoption={adoption}
    />
  );
}
