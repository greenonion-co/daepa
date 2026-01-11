import { notFound } from "next/navigation";
import {
  PetDto,
  PetAdoptionDto,
  PetImageItem,
  GetParentsByPetIdResponseDtoData,
} from "@repo/api-client";
import { getServerRequestHeaders } from "@/lib/server/auth";
import PetModalContent from "./PetModalContent";

interface PetModalPageProps {
  params: Promise<{
    petId: string;
  }>;
}

// 펫 데이터 fetch 함수
async function getPet(petId: string): Promise<PetDto | null> {
  const url = `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/api/v1/pet/${petId}`;
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

// 이미지 fetch
async function getImages(petId: string): Promise<PetImageItem[]> {
  const url = `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/api/v1/pet-image/${petId}`;
  const headers = await getServerRequestHeaders();

  try {
    const res = await fetch(url, { cache: "no-store", headers });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// 부모 정보 fetch
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

// 분양 정보 fetch
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

export default async function PetModalPage({ params }: PetModalPageProps) {
  const { petId } = await params;

  // 모든 데이터를 병렬로 fetch
  const [pet, images, parents, adoption] = await Promise.all([
    getPet(petId),
    getImages(petId),
    getParents(petId),
    getAdoption(petId),
  ]);

  if (!pet) {
    notFound();
  }

  return (
    <PetModalContent
      pet={pet}
      initialImages={images}
      initialParents={parents}
      initialAdoption={adoption}
    />
  );
}
