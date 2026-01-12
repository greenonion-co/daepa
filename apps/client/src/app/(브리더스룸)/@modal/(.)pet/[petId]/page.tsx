import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PetDetailModalBack } from "@/app/(브리더스룸)/pet/[petId]/components/PetDetailModal";
import PetDetailLayout from "@/app/(브리더스룸)/pet/[petId]/components/PetDetailLayout";
import { fetchPet, SectionSkeleton } from "@/app/(브리더스룸)/pet/[petId]/page";
import BreedingInfo from "@/app/(브리더스룸)/pet/[petId]/components/펫정보";
import Images from "@/app/(브리더스룸)/pet/[petId]/components/이미지";
import PedigreeInfo from "@/app/(브리더스룸)/pet/[petId]/components/혈통정보";
import AdoptionInfo from "@/app/(브리더스룸)/pet/[petId]/components/분양정보";

interface PetModalPageProps {
  params: Promise<{
    petId: string;
  }>;
}

export default async function PetModalPage({ params }: PetModalPageProps) {
  const { petId } = await params;

  const pet = await fetchPet(petId);

  if (!pet) {
    notFound();
  }

  return (
    <PetDetailModalBack>
      <PetDetailLayout
        pet={pet}
        variant={"modal"}
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
    </PetDetailModalBack>
  );
}
