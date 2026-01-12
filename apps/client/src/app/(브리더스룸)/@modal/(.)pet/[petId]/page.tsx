import { PetDetailModalBack } from "@/app/(브리더스룸)/pet/[petId]/components/PetDetailModal";
import PetDetailLayout from "@/app/(브리더스룸)/pet/[petId]/components/PetDetailLayout";
import { loadPetDetailPageData } from "@/app/(브리더스룸)/pet/[petId]/data";
import { createPetDetailSlots } from "@/app/(브리더스룸)/pet/[petId]/components/createPetDetailSlots";

interface PetModalPageProps {
  params: Promise<{
    petId: string;
  }>;
}

export default async function PetModalPage({ params }: PetModalPageProps) {
  const { petId } = await params;
  const pet = await loadPetDetailPageData(petId);

  return (
    <PetDetailModalBack>
      <PetDetailLayout pet={pet} variant="modal" {...createPetDetailSlots(pet)} />
    </PetDetailModalBack>
  );
}
