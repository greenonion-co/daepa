import { GetParentsByPetIdResponseDtoData, PetDtoSpecies } from "@repo/api-client";
import { getServerRequestHeaders } from "@/lib/server/auth";
import PedigreeInfoContent from "./PedigreeInfoContent";

interface PedigreeInfoProps {
  species: PetDtoSpecies;
  petId: string;
  userId: string;
}

async function getParents(petId: string): Promise<GetParentsByPetIdResponseDtoData | null> {
  const url = `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/api/v1/pet/parents/${petId}`;
  const headers = await getServerRequestHeaders();

  try {
    const res = await fetch(url, { cache: "no-store", headers });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

export default async function PedigreeInfo({ species, petId, userId }: PedigreeInfoProps) {
  const parents = await getParents(petId);

  return (
    <PedigreeInfoContent species={species} petId={petId} userId={userId} initialParents={parents} />
  );
}
