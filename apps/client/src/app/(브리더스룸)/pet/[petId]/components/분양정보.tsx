import { cookies } from "next/headers";
import { PetAdoptionDto } from "@repo/api-client";
import AdoptionInfoContent from "./AdoptionInfoContent";

interface AdoptionInfoProps {
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

async function getAdoption(petId: string): Promise<PetAdoptionDto | null> {
  const url = `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/api/v1/adoption/by-pet/${petId}`;
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

export default async function AdoptionInfo({ petId, ownerId }: AdoptionInfoProps) {
  const adoption = await getAdoption(petId);

  return <AdoptionInfoContent petId={petId} ownerId={ownerId} initialAdoption={adoption} />;
}
