import { PetDto, PetImageItem } from "@repo/api-client";
import { getServerRequestHeaders } from "@/lib/server/auth";
import ImagesContent from "./ImagesContent";

interface ImagesProps {
  pet: PetDto;
}

async function getImages(petId: string): Promise<PetImageItem[]> {
  const url = `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/api/v1/pet-image/${petId}`;
  const headers = await getServerRequestHeaders();

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
