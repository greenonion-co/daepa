import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PetDto } from "@repo/api-client";
import { getServerRequestHeaders } from "@/lib/server/auth";
import PetList from "../../components/PetList";
import PetDetailLayout from "@/app/(브리더스룸)/pet/[petId]/components/PetDetailLayout";
import { PetDetailModalPush } from "@/app/(브리더스룸)/pet/[petId]/components/PetDetailModal";
import BreedingInfo from "@/app/(브리더스룸)/pet/[petId]/components/펫정보";
import Images from "@/app/(브리더스룸)/pet/[petId]/components/이미지";
import PedigreeInfo from "@/app/(브리더스룸)/pet/[petId]/components/혈통정보";
import AdoptionInfo from "@/app/(브리더스룸)/pet/[petId]/components/분양정보";
import { SectionSkeleton } from "../@public/page";

interface AuthPageProps {
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

export default async function AuthPage({ params }: AuthPageProps) {
  const { petId } = await params;

  const pet = await getPet(petId);

  if (!pet) {
    redirect("/pet?error=pet-not-found");
  }

  return (
    <>
      <PetList />
      <PetDetailModalPush>
        <PetDetailLayout
          pet={pet}
          variant="modal"
          breedingSlot={
            <Suspense fallback={<SectionSkeleton />}>
              <BreedingInfo petId={pet.petId} ownerId={pet.owner.userId ?? ""} />
            </Suspense>
          }
          imagesSlot={
            <Suspense fallback={<SectionSkeleton />}>
              <Images pet={pet} />
            </Suspense>
          }
          pedigreeSlot={
            <Suspense fallback={<SectionSkeleton />}>
              <PedigreeInfo species={pet.species} petId={pet.petId} userId={pet.owner.userId ?? ""} />
            </Suspense>
          }
          adoptionSlot={
            <Suspense fallback={<SectionSkeleton />}>
              <AdoptionInfo petId={pet.petId} ownerId={pet.owner.userId ?? ""} />
            </Suspense>
          }
        />
      </PetDetailModalPush>
    </>
  );
}
