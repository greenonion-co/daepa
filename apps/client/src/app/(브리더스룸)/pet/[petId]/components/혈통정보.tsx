import { cookies } from "next/headers";
import { GetParentsByPetIdResponseDtoData, PetDtoSpecies } from "@repo/api-client";
import PedigreeInfoContent from "./PedigreeInfoContent";

interface PedigreeInfoProps {
  species: PetDtoSpecies;
  petId: string;
  userId: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (accessToken) {
    return { Authorization: `Bearer ${accessToken}` };
  }
  return {};
}

async function getParents(petId: string): Promise<GetParentsByPetIdResponseDtoData | null> {
  const url = `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/api/v1/pet/parents/${petId}`;
  const headers = await getAuthHeaders();

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
