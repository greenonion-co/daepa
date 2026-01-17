import { PetDto } from "@repo/api-client";
import { fetchParents } from "../data";
import PedigreeInfoContent from "./PedigreeInfoContent";

interface PedigreeInfoProps {
  pet: PetDto;
}

export default async function PedigreeInfo({ pet }: PedigreeInfoProps) {
  const parents = await fetchParents(pet.petId);

  return (
    <PedigreeInfoContent
      species={pet.species}
      petId={pet.petId}
      userId={pet.owner?.userId}
      initialParents={parents}
    />
  );
}
