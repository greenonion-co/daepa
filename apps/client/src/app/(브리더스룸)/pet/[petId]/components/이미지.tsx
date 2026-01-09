import { cookies } from "next/headers";
import { PetDto, PetImageItem } from "@repo/api-client";
import ImagesContent from "./ImagesContent";

interface ImagesProps {
  pet: PetDto;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (accessToken) {
    return { Authorization: `Bearer ${accessToken}` };
  }
  return {};
}

async function getImages(petId: string): Promise<PetImageItem[]> {
  const url = `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/api/v1/pet-image/${petId}`;
  const headers = await getAuthHeaders();

  try {
    const res = await fetch(url, { cache: "no-store", headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data;
  } catch {
    return [];
  }
}

export default async function Images({ pet }: ImagesProps) {
  const images = await getImages(pet.petId);

  return <ImagesContent pet={pet} initialImages={images} />;
}
