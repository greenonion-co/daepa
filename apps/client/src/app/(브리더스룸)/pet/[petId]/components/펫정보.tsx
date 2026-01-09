import { cookies } from "next/headers";
import { PetDto } from "@repo/api-client";
import BreedingInfoContent from "./BreedingInfoContent";

interface BreedingInfoProps {
  petId: string;
  ownerId: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (accessToken) {
    return { Authorization: `Bearer ${accessToken}` };
  }
  return {};
}

async function getPet(petId: string): Promise<PetDto | null> {
  const url = `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/api/v1/pet/${petId}`;
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

export default async function BreedingInfo({ petId, ownerId }: BreedingInfoProps) {
  const pet = await getPet(petId);

  return <BreedingInfoContent petId={petId} ownerId={ownerId} initialPet={pet} />;
}
