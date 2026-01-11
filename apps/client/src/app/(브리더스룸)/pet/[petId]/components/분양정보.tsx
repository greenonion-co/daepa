import { PetAdoptionDto } from "@repo/api-client";
import { getServerRequestHeaders } from "@/lib/server/auth";
import AdoptionInfoContent from "./AdoptionInfoContent";

interface AdoptionInfoProps {
  petId: string;
  ownerId: string;
}

async function getAdoption(petId: string): Promise<PetAdoptionDto | null> {
  const url = `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/api/v1/adoption/by-pet/${petId}`;
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

export default async function AdoptionInfo({ petId, ownerId }: AdoptionInfoProps) {
  const adoption = await getAdoption(petId);

  return <AdoptionInfoContent petId={petId} ownerId={ownerId} initialAdoption={adoption} />;
}
